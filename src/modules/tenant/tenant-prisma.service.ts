import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaService.name);
  private clients = new Map<string, { client: PrismaClient; lastUsed: number }>();
  private readonly maxClients = 50;

  getClient(schemaName: string): PrismaClient {
    const entry = this.clients.get(schemaName);

    if (entry) {
      entry.lastUsed = Date.now();
      return entry.client;
    }

    if (this.clients.size >= this.maxClients) {
      this.evictOldest();
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}?schema=${schemaName}`;

    const client = new PrismaClient({
      datasources: { db: { url } },
    });

    this.clients.set(schemaName, { client, lastUsed: Date.now() });
    this.logger.log(`Created PrismaClient for schema: ${schemaName}`);

    return client;
  }

  private getBaseUrl(): string {
    const url = process.env.DATABASE_URL || '';
    return url.split('?')[0];
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.clients.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.clients.get(oldestKey);
      if (entry) {
        entry.client.$disconnect().catch(() => {});
        this.clients.delete(oldestKey);
        this.logger.log(`Evicted PrismaClient for schema: ${oldestKey}`);
      }
    }
  }

  async onModuleDestroy() {
    const disconnects = Array.from(this.clients.values()).map((entry) =>
      entry.client.$disconnect(),
    );
    await Promise.allSettled(disconnects);
    this.clients.clear();
  }
}

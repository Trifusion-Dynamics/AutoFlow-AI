-- CreateIndex
CREATE INDEX "executions_orgId_status_idx" ON "executions"("orgId", "status");

-- CreateIndex
CREATE INDEX "executions_orgId_createdAt_idx" ON "executions"("orgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "outbound_webhook_deliveries_webhookId_createdAt_idx" ON "outbound_webhook_deliveries"("webhookId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "workflows_orgId_status_idx" ON "workflows"("orgId", "status");

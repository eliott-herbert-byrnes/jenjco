drop extension if exists "pg_net";

create schema if not exists "mastra";

drop policy "users_select_same_org" on "public"."users";


  create table "mastra"."mastra_agent_versions" (
    "id" text not null,
    "agentId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text,
    "instructions" text not null,
    "model" jsonb not null,
    "tools" jsonb,
    "defaultOptions" jsonb,
    "workflows" jsonb,
    "agents" jsonb,
    "integrationTools" jsonb,
    "inputProcessors" jsonb,
    "outputProcessors" jsonb,
    "memory" jsonb,
    "scorers" jsonb,
    "mcpClients" jsonb,
    "requestContextSchema" jsonb,
    "workspace" jsonb,
    "skills" jsonb,
    "skillsFormat" text,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_agents" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_ai_spans" (
    "traceId" text not null,
    "spanId" text not null,
    "name" text not null,
    "spanType" text not null,
    "isEvent" boolean not null,
    "startedAt" timestamp without time zone not null,
    "parentSpanId" text,
    "entityType" text,
    "entityId" text,
    "entityName" text,
    "parentEntityType" text,
    "parentEntityId" text,
    "parentEntityName" text,
    "rootEntityType" text,
    "rootEntityId" text,
    "rootEntityName" text,
    "userId" text,
    "organizationId" text,
    "resourceId" text,
    "runId" text,
    "sessionId" text,
    "threadId" text,
    "requestId" text,
    "environment" text,
    "serviceName" text,
    "scope" jsonb,
    "experimentId" text,
    "source" text,
    "metadata" jsonb,
    "tags" jsonb,
    "attributes" jsonb,
    "links" jsonb,
    "input" jsonb,
    "output" jsonb,
    "error" jsonb,
    "endedAt" timestamp without time zone,
    "requestContext" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone,
    "startedAtZ" timestamp with time zone default now(),
    "endedAtZ" timestamp with time zone default now(),
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_dataset_items" (
    "id" text not null,
    "datasetId" text not null,
    "datasetVersion" integer not null,
    "validTo" integer,
    "isDeleted" boolean not null,
    "input" jsonb not null,
    "groundTruth" jsonb,
    "requestContext" jsonb,
    "metadata" jsonb,
    "source" jsonb,
    "expectedTrajectory" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_dataset_versions" (
    "id" text not null,
    "datasetId" text not null,
    "version" integer not null,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_datasets" (
    "id" text not null,
    "name" text not null,
    "description" text,
    "metadata" jsonb,
    "inputSchema" jsonb,
    "groundTruthSchema" jsonb,
    "requestContextSchema" jsonb,
    "tags" jsonb,
    "targetType" text,
    "targetIds" jsonb,
    "scorerIds" jsonb,
    "version" integer not null,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_experiment_results" (
    "id" text not null,
    "experimentId" text not null,
    "itemId" text not null,
    "itemDatasetVersion" integer,
    "input" jsonb not null,
    "output" jsonb,
    "groundTruth" jsonb,
    "error" jsonb,
    "startedAt" timestamp without time zone not null,
    "completedAt" timestamp without time zone not null,
    "retryCount" integer not null,
    "traceId" text,
    "status" text,
    "tags" jsonb,
    "createdAt" timestamp without time zone not null,
    "startedAtZ" timestamp with time zone default now(),
    "completedAtZ" timestamp with time zone default now(),
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_experiments" (
    "id" text not null,
    "name" text,
    "description" text,
    "metadata" jsonb,
    "datasetId" text,
    "datasetVersion" integer,
    "targetType" text not null,
    "targetId" text not null,
    "status" text not null,
    "totalItems" integer not null,
    "succeededCount" integer not null,
    "failedCount" integer not null,
    "skippedCount" integer not null,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "agentVersion" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "startedAtZ" timestamp with time zone default now(),
    "completedAtZ" timestamp with time zone default now(),
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_mcp_client_versions" (
    "id" text not null,
    "mcpClientId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text,
    "servers" jsonb not null,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_mcp_clients" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_mcp_server_versions" (
    "id" text not null,
    "mcpServerId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "version" text not null,
    "description" text,
    "instructions" text,
    "repository" jsonb,
    "releaseDate" text,
    "isLatest" boolean,
    "packageCanonical" text,
    "tools" jsonb,
    "agents" jsonb,
    "workflows" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_mcp_servers" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_messages" (
    "id" text not null,
    "thread_id" text not null,
    "content" text not null,
    "role" text not null,
    "type" text not null,
    "createdAt" timestamp without time zone not null,
    "resourceId" text,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_observational_memory" (
    "id" text not null,
    "lookupKey" text not null,
    "scope" text not null,
    "resourceId" text,
    "threadId" text,
    "activeObservations" text not null,
    "activeObservationsPendingUpdate" text,
    "originType" text not null,
    "config" text not null,
    "generationCount" integer not null,
    "lastObservedAt" timestamp without time zone,
    "lastReflectionAt" timestamp without time zone,
    "pendingMessageTokens" integer not null,
    "totalTokensObserved" integer not null,
    "observationTokenCount" integer not null,
    "isObserving" boolean not null,
    "isReflecting" boolean not null,
    "observedMessageIds" jsonb,
    "observedTimezone" text,
    "bufferedObservations" text,
    "bufferedObservationTokens" integer,
    "bufferedMessageIds" jsonb,
    "bufferedReflection" text,
    "bufferedReflectionTokens" integer,
    "bufferedReflectionInputTokens" integer,
    "reflectedObservationLineCount" integer,
    "bufferedObservationChunks" jsonb,
    "isBufferingObservation" boolean not null,
    "isBufferingReflection" boolean not null,
    "lastBufferedAtTokens" integer not null,
    "lastBufferedAtTime" timestamp without time zone,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "lastObservedAtZ" timestamp with time zone default now(),
    "lastReflectionAtZ" timestamp with time zone default now(),
    "lastBufferedAtTimeZ" timestamp with time zone default now(),
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_prompt_block_versions" (
    "id" text not null,
    "blockId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text,
    "content" text not null,
    "rules" jsonb,
    "requestContextSchema" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_prompt_blocks" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_resources" (
    "id" text not null,
    "workingMemory" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_scorer_definition_versions" (
    "id" text not null,
    "scorerDefinitionId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text,
    "type" text not null,
    "model" jsonb,
    "instructions" text,
    "scoreRange" jsonb,
    "presetConfig" jsonb,
    "defaultSampling" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_scorer_definitions" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_scorers" (
    "id" text not null,
    "scorerId" text not null,
    "traceId" text,
    "spanId" text,
    "runId" text not null,
    "scorer" jsonb not null,
    "preprocessStepResult" jsonb,
    "extractStepResult" jsonb,
    "analyzeStepResult" jsonb,
    "score" double precision not null,
    "reason" text,
    "metadata" jsonb,
    "preprocessPrompt" text,
    "extractPrompt" text,
    "generateScorePrompt" text,
    "generateReasonPrompt" text,
    "analyzePrompt" text,
    "reasonPrompt" text,
    "input" jsonb not null,
    "output" jsonb not null,
    "additionalContext" jsonb,
    "requestContext" jsonb,
    "entityType" text,
    "entity" jsonb,
    "entityId" text,
    "source" text not null,
    "resourceId" text,
    "threadId" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_skill_blobs" (
    "hash" text not null,
    "content" text not null,
    "size" integer not null,
    "mimeType" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_skill_versions" (
    "id" text not null,
    "skillId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text not null,
    "instructions" text not null,
    "license" text,
    "compatibility" jsonb,
    "source" jsonb,
    "references" jsonb,
    "scripts" jsonb,
    "assets" jsonb,
    "metadata" jsonb,
    "tree" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_skills" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_threads" (
    "id" text not null,
    "resourceId" text not null,
    "title" text not null,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_workflow_snapshot" (
    "workflow_name" text not null,
    "run_id" text not null,
    "resourceId" text,
    "snapshot" jsonb not null,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_workspace_versions" (
    "id" text not null,
    "workspaceId" text not null,
    "versionNumber" integer not null,
    "name" text not null,
    "description" text,
    "filesystem" jsonb,
    "sandbox" jsonb,
    "mounts" jsonb,
    "search" jsonb,
    "skills" jsonb,
    "tools" jsonb,
    "autoSync" boolean,
    "operationTimeout" integer,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now()
      );



  create table "mastra"."mastra_workspaces" (
    "id" text not null,
    "status" text not null,
    "activeVersionId" text,
    "authorId" text,
    "metadata" jsonb,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "createdAtZ" timestamp with time zone default now(),
    "updatedAtZ" timestamp with time zone default now()
      );


CREATE INDEX idx_dataset_items_dataset_validto ON mastra.mastra_dataset_items USING btree ("datasetId", "validTo");

CREATE INDEX idx_dataset_items_dataset_validto_deleted ON mastra.mastra_dataset_items USING btree ("datasetId", "validTo", "isDeleted");

CREATE INDEX idx_dataset_items_dataset_version ON mastra.mastra_dataset_items USING btree ("datasetId", "datasetVersion");

CREATE INDEX idx_dataset_versions_dataset_version ON mastra.mastra_dataset_versions USING btree ("datasetId", version);

CREATE UNIQUE INDEX idx_dataset_versions_dataset_version_unique ON mastra.mastra_dataset_versions USING btree ("datasetId", version);

CREATE UNIQUE INDEX idx_experiment_results_exp_item ON mastra.mastra_experiment_results USING btree ("experimentId", "itemId");

CREATE INDEX idx_experiment_results_experimentid ON mastra.mastra_experiment_results USING btree ("experimentId");

CREATE INDEX idx_experiments_datasetid ON mastra.mastra_experiments USING btree ("datasetId");

CREATE UNIQUE INDEX idx_mcp_client_versions_client_version ON mastra.mastra_mcp_client_versions USING btree ("mcpClientId", "versionNumber");

CREATE UNIQUE INDEX idx_mcp_server_versions_server_version ON mastra.mastra_mcp_server_versions USING btree ("mcpServerId", "versionNumber");

CREATE INDEX idx_om_lookup_key ON mastra.mastra_observational_memory USING btree ("lookupKey");

CREATE UNIQUE INDEX idx_skill_versions_skill_version ON mastra.mastra_skill_versions USING btree ("skillId", "versionNumber");

CREATE UNIQUE INDEX idx_workspace_versions_workspace_version ON mastra.mastra_workspace_versions USING btree ("workspaceId", "versionNumber");

CREATE UNIQUE INDEX mastra_agent_versions_pkey ON mastra.mastra_agent_versions USING btree (id);

CREATE UNIQUE INDEX mastra_agents_pkey ON mastra.mastra_agents USING btree (id);

CREATE UNIQUE INDEX mastra_dataset_items_pkey ON mastra.mastra_dataset_items USING btree (id, "datasetVersion");

CREATE UNIQUE INDEX mastra_dataset_versions_pkey ON mastra.mastra_dataset_versions USING btree (id);

CREATE UNIQUE INDEX mastra_datasets_pkey ON mastra.mastra_datasets USING btree (id);

CREATE UNIQUE INDEX mastra_experiment_results_pkey ON mastra.mastra_experiment_results USING btree (id);

CREATE UNIQUE INDEX mastra_experiments_pkey ON mastra.mastra_experiments USING btree (id);

CREATE UNIQUE INDEX mastra_idx_prompt_block_versions_block_version ON mastra.mastra_prompt_block_versions USING btree ("blockId", "versionNumber");

CREATE UNIQUE INDEX mastra_idx_scorer_definition_versions_def_version ON mastra.mastra_scorer_definition_versions USING btree ("scorerDefinitionId", "versionNumber");

CREATE INDEX mastra_mastra_ai_spans_entitytype_entityid_idx ON mastra.mastra_ai_spans USING btree ("entityType", "entityId");

CREATE INDEX mastra_mastra_ai_spans_entitytype_entityname_idx ON mastra.mastra_ai_spans USING btree ("entityType", "entityName");

CREATE INDEX mastra_mastra_ai_spans_metadata_gin_idx ON mastra.mastra_ai_spans USING gin (metadata);

CREATE INDEX mastra_mastra_ai_spans_name_idx ON mastra.mastra_ai_spans USING btree (name);

CREATE INDEX mastra_mastra_ai_spans_orgid_userid_idx ON mastra.mastra_ai_spans USING btree ("organizationId", "userId");

CREATE INDEX mastra_mastra_ai_spans_parentspanid_startedat_idx ON mastra.mastra_ai_spans USING btree ("parentSpanId", "startedAt" DESC);

CREATE INDEX mastra_mastra_ai_spans_root_spans_idx ON mastra.mastra_ai_spans USING btree ("startedAt" DESC) WHERE ("parentSpanId" IS NULL);

CREATE INDEX mastra_mastra_ai_spans_spantype_startedat_idx ON mastra.mastra_ai_spans USING btree ("spanType", "startedAt" DESC);

CREATE INDEX mastra_mastra_ai_spans_tags_gin_idx ON mastra.mastra_ai_spans USING gin (tags);

CREATE UNIQUE INDEX mastra_mastra_ai_spans_traceid_spanid_pk ON mastra.mastra_ai_spans USING btree ("traceId", "spanId");

CREATE INDEX mastra_mastra_ai_spans_traceid_startedat_idx ON mastra.mastra_ai_spans USING btree ("traceId", "startedAt" DESC);

CREATE INDEX mastra_mastra_messages_thread_id_createdat_idx ON mastra.mastra_messages USING btree (thread_id, "createdAt" DESC);

CREATE INDEX mastra_mastra_scores_trace_id_span_id_created_at_idx ON mastra.mastra_scorers USING btree ("traceId", "spanId", "createdAt" DESC);

CREATE INDEX mastra_mastra_threads_resourceid_createdat_idx ON mastra.mastra_threads USING btree ("resourceId", "createdAt" DESC);

CREATE UNIQUE INDEX mastra_mastra_workflow_snapshot_workflow_name_run_id_key ON mastra.mastra_workflow_snapshot USING btree (workflow_name, run_id);

CREATE UNIQUE INDEX mastra_mcp_client_versions_pkey ON mastra.mastra_mcp_client_versions USING btree (id);

CREATE UNIQUE INDEX mastra_mcp_clients_pkey ON mastra.mastra_mcp_clients USING btree (id);

CREATE UNIQUE INDEX mastra_mcp_server_versions_pkey ON mastra.mastra_mcp_server_versions USING btree (id);

CREATE UNIQUE INDEX mastra_mcp_servers_pkey ON mastra.mastra_mcp_servers USING btree (id);

CREATE UNIQUE INDEX mastra_messages_pkey ON mastra.mastra_messages USING btree (id);

CREATE UNIQUE INDEX mastra_observational_memory_pkey ON mastra.mastra_observational_memory USING btree (id);

CREATE UNIQUE INDEX mastra_prompt_block_versions_pkey ON mastra.mastra_prompt_block_versions USING btree (id);

CREATE UNIQUE INDEX mastra_prompt_blocks_pkey ON mastra.mastra_prompt_blocks USING btree (id);

CREATE UNIQUE INDEX mastra_resources_pkey ON mastra.mastra_resources USING btree (id);

CREATE UNIQUE INDEX mastra_scorer_definition_versions_pkey ON mastra.mastra_scorer_definition_versions USING btree (id);

CREATE UNIQUE INDEX mastra_scorer_definitions_pkey ON mastra.mastra_scorer_definitions USING btree (id);

CREATE UNIQUE INDEX mastra_scorers_pkey ON mastra.mastra_scorers USING btree (id);

CREATE UNIQUE INDEX mastra_skill_blobs_pkey ON mastra.mastra_skill_blobs USING btree (hash);

CREATE UNIQUE INDEX mastra_skill_versions_pkey ON mastra.mastra_skill_versions USING btree (id);

CREATE UNIQUE INDEX mastra_skills_pkey ON mastra.mastra_skills USING btree (id);

CREATE UNIQUE INDEX mastra_threads_pkey ON mastra.mastra_threads USING btree (id);

CREATE UNIQUE INDEX mastra_workspace_versions_pkey ON mastra.mastra_workspace_versions USING btree (id);

CREATE UNIQUE INDEX mastra_workspaces_pkey ON mastra.mastra_workspaces USING btree (id);

alter table "mastra"."mastra_agent_versions" add constraint "mastra_agent_versions_pkey" PRIMARY KEY using index "mastra_agent_versions_pkey";

alter table "mastra"."mastra_agents" add constraint "mastra_agents_pkey" PRIMARY KEY using index "mastra_agents_pkey";

alter table "mastra"."mastra_ai_spans" add constraint "mastra_mastra_ai_spans_traceid_spanid_pk" PRIMARY KEY using index "mastra_mastra_ai_spans_traceid_spanid_pk";

alter table "mastra"."mastra_dataset_items" add constraint "mastra_dataset_items_pkey" PRIMARY KEY using index "mastra_dataset_items_pkey";

alter table "mastra"."mastra_dataset_versions" add constraint "mastra_dataset_versions_pkey" PRIMARY KEY using index "mastra_dataset_versions_pkey";

alter table "mastra"."mastra_datasets" add constraint "mastra_datasets_pkey" PRIMARY KEY using index "mastra_datasets_pkey";

alter table "mastra"."mastra_experiment_results" add constraint "mastra_experiment_results_pkey" PRIMARY KEY using index "mastra_experiment_results_pkey";

alter table "mastra"."mastra_experiments" add constraint "mastra_experiments_pkey" PRIMARY KEY using index "mastra_experiments_pkey";

alter table "mastra"."mastra_mcp_client_versions" add constraint "mastra_mcp_client_versions_pkey" PRIMARY KEY using index "mastra_mcp_client_versions_pkey";

alter table "mastra"."mastra_mcp_clients" add constraint "mastra_mcp_clients_pkey" PRIMARY KEY using index "mastra_mcp_clients_pkey";

alter table "mastra"."mastra_mcp_server_versions" add constraint "mastra_mcp_server_versions_pkey" PRIMARY KEY using index "mastra_mcp_server_versions_pkey";

alter table "mastra"."mastra_mcp_servers" add constraint "mastra_mcp_servers_pkey" PRIMARY KEY using index "mastra_mcp_servers_pkey";

alter table "mastra"."mastra_messages" add constraint "mastra_messages_pkey" PRIMARY KEY using index "mastra_messages_pkey";

alter table "mastra"."mastra_observational_memory" add constraint "mastra_observational_memory_pkey" PRIMARY KEY using index "mastra_observational_memory_pkey";

alter table "mastra"."mastra_prompt_block_versions" add constraint "mastra_prompt_block_versions_pkey" PRIMARY KEY using index "mastra_prompt_block_versions_pkey";

alter table "mastra"."mastra_prompt_blocks" add constraint "mastra_prompt_blocks_pkey" PRIMARY KEY using index "mastra_prompt_blocks_pkey";

alter table "mastra"."mastra_resources" add constraint "mastra_resources_pkey" PRIMARY KEY using index "mastra_resources_pkey";

alter table "mastra"."mastra_scorer_definition_versions" add constraint "mastra_scorer_definition_versions_pkey" PRIMARY KEY using index "mastra_scorer_definition_versions_pkey";

alter table "mastra"."mastra_scorer_definitions" add constraint "mastra_scorer_definitions_pkey" PRIMARY KEY using index "mastra_scorer_definitions_pkey";

alter table "mastra"."mastra_scorers" add constraint "mastra_scorers_pkey" PRIMARY KEY using index "mastra_scorers_pkey";

alter table "mastra"."mastra_skill_blobs" add constraint "mastra_skill_blobs_pkey" PRIMARY KEY using index "mastra_skill_blobs_pkey";

alter table "mastra"."mastra_skill_versions" add constraint "mastra_skill_versions_pkey" PRIMARY KEY using index "mastra_skill_versions_pkey";

alter table "mastra"."mastra_skills" add constraint "mastra_skills_pkey" PRIMARY KEY using index "mastra_skills_pkey";

alter table "mastra"."mastra_threads" add constraint "mastra_threads_pkey" PRIMARY KEY using index "mastra_threads_pkey";

alter table "mastra"."mastra_workspace_versions" add constraint "mastra_workspace_versions_pkey" PRIMARY KEY using index "mastra_workspace_versions_pkey";

alter table "mastra"."mastra_workspaces" add constraint "mastra_workspaces_pkey" PRIMARY KEY using index "mastra_workspaces_pkey";

alter table "mastra"."mastra_workflow_snapshot" add constraint "mastra_mastra_workflow_snapshot_workflow_name_run_id_key" UNIQUE using index "mastra_mastra_workflow_snapshot_workflow_name_run_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION mastra.trigger_set_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW."createdAt" = NOW();
        NEW."updatedAt" = NOW();
        NEW."createdAtZ" = NOW();
        NEW."updatedAtZ" = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW."updatedAt" = NOW();
        NEW."updatedAtZ" = NOW();
        NEW."createdAt" = OLD."createdAt";
        NEW."createdAtZ" = OLD."createdAtZ";
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select org_id from public.users where supabase_auth_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.search_processes(query_embedding public.vector, org_id_filter uuid, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, content text, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    id,
    title,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM org_processes
  WHERE org_id = org_id_filter
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$function$
;


  create policy "users_select_same_org"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((org_id = public.current_user_org_id()));


CREATE TRIGGER mastra_ai_spans_timestamps BEFORE INSERT OR UPDATE ON mastra.mastra_ai_spans FOR EACH ROW EXECUTE FUNCTION mastra.trigger_set_timestamps();



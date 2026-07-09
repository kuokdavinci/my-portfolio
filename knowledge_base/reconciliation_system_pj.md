# Reconciliation Ingestion Platform

> A configurable platform for ingesting partner settlement files, normalizing them into canonical transactions, and performing deterministic reconciliation against internal transaction records.
> Designed for fintech and payment operations teams that need scalable reconciliation, configurable mapping, and human-in-the-loop review workflows.

## Overview

### Summary

Reconciliation Ingestion Platform is a configurable reconciliation system that automates partner settlement file ingestion, normalization, validation, reconciliation, and operational review. Instead of implementing custom parsers for every payment partner, the platform relies on configurable mapping definitions and reusable ingestion pipelines. It supports multiple file sources, deterministic transaction matching, AI-assisted mapping generation, approval workflows, scheduling, and audit logging. The system is designed to efficiently process both small daily settlement files and high-volume reconciliation workloads exceeding 100,000 transactions.

### Metadata

- `category`: `project`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Overview`
- `chunk_title`: `Summary`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `overview`

---

## Problem & Goals

### Problem Statement

Financial systems frequently receive settlement files from different payment providers, each using unique schemas, naming conventions, file formats, and delivery mechanisms. Traditional reconciliation systems require custom development whenever a partner changes its format, creating maintenance overhead and operational risks.

The platform solves this by introducing configurable field mappings, standardized canonical transactions, deterministic reconciliation logic, AI-assisted mapping generation, and guided review workflows. New partner integrations can be configured with minimal engineering effort while preserving auditability and data consistency.

### Goals

- Support configurable ingestion for multiple partners.
- Normalize heterogeneous settlement files into a canonical transaction model.
- Perform deterministic reconciliation against internal transactions.
- Minimize manual mapping development using AI-assisted suggestions.
- Support human approval before activating configuration changes.
- Process large datasets efficiently through batch processing.
- Maintain complete audit history for operational changes.
- Enable scheduled automated ingestion from SFTP and other external sources.

### Metadata

- `category`: `project_detail`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Problem & Goals`
- `chunk_title`: `Problem Statement`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `detail`

---

## Architecture & Stack

### Tech Stack

**Backend**

- Python 3.11
- FastAPI
- Uvicorn
- APScheduler

**Frontend**

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Databases**

- MongoDB (configuration, audit, review workflows)
- PostgreSQL (high-performance ingestion and reconciliation)

**Infrastructure**

- Docker
- Docker Compose
- Paramiko (SFTP)

**Data Processing**

- python-calamine
- CSV
- JSON
- AsyncIO
- SQLAlchemy
- asyncpg

**AI**

- OpenAI-compatible REST API

### System Design

The platform follows a layered architecture consisting of a Next.js dashboard, FastAPI backend services, configurable ingestion pipelines, reconciliation engines, schedulers, and persistent storage.

Incoming partner files are retrieved from APIs, SFTP servers, or uploaded manually. Streaming readers parse the files before the normalization layer converts partner-specific fields into canonical transactions using configurable mappings. Validation rules ensure schema correctness before transactions are persisted.

The reconciliation engine compares partner transactions with internal transaction records using deterministic matching rules and writes reconciliation results in batches. AI services provide mapping suggestions and operational insights, while review packets ensure mapping modifications require explicit approval before activation.

### Metadata

- `category`: `project_detail`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Architecture & Stack`
- `chunk_title`: `System Design`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `detail`

---

## Core Workflows

### Workflow 1

**Partner File Ingestion**

1. Receive partner settlement file from upload, SFTP, or scheduled job.
2. Detect duplicate files using SHA256 hashing.
3. Load mapping configuration from cache or database.
4. Parse CSV, Excel, or JSON through streaming readers.
5. Normalize fields into canonical transaction objects.
6. Validate required fields, types, and business rules.
7. Bulk insert validated transactions.
8. Generate structured logs throughout execution.

### Workflow 2

**Transaction Reconciliation**

1. Select reconciliation scope for a partner and business date.
2. Load partner transactions and internal transactions.
3. Build internal transaction indexes.
4. Compare transactions by business matching rules.
5. Assign reconciliation status.
6. Batch persist reconciliation results.
7. Generate operational insights.
8. Present results through the dashboard for review.

### Metadata

- `category`: `project_detail`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Core Workflows`
- `chunk_title`: `Workflow 1`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `detail`

---

## Key Details

### Important Constraints

The platform prioritizes throughput, configurability, and operational reliability.

Large settlement files are processed using streaming readers to avoid excessive memory consumption. Batch insertion, asynchronous processing, PostgreSQL COPY operations, and configurable worker pools improve scalability for high-volume workloads.

Configuration updates follow a human-in-the-loop approval process before becoming active, ensuring production mappings remain controlled. Audit events are recorded for configuration changes, approvals, and operational actions.

The reconciliation engine emphasizes deterministic matching rather than probabilistic inference, ensuring reconciliation results remain reproducible and explainable.

### Tradeoffs

MongoDB provides flexible storage for dynamic configuration, review packets, and audit history, while PostgreSQL is optimized for transactional ingestion and SQL-based reconciliation.

AI-generated mappings improve onboarding speed but never bypass human approval. Maintaining two databases increases operational complexity but allows each workload to use the storage engine best suited to its access pattern.

### Metadata

- `category`: `project_detail`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Key Details`
- `chunk_title`: `Important Constraints`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `detail`

---

## Notes

### Known Issues

Documentation may occasionally lag behind implementation. Runtime behavior, API routes, environment variables, and CLI commands should always be verified against the source code. Configuration definitions and router registrations are considered the authoritative implementation.

### Maintainer Notes

Maintain a single canonical transaction model across all modules. New payment partners should be integrated through configuration rather than custom code whenever possible. Preserve deterministic reconciliation logic, structured logging, and approval workflows when introducing new ingestion capabilities. Keep terminology consistent across backend services, frontend dashboards, and documentation.

### Metadata

- `category`: `project_detail`
- `doc_title`: `Reconciliation Ingestion Platform`
- `section_title`: `Notes`
- `chunk_title`: `Known Issues`
- `project_id`: `reconciliation-ingestion-platform`
- `chunk_type`: `detail`
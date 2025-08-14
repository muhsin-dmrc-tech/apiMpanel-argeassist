#!/bin/bash
BACKUP_DIR="/var/lib/postgresql/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="wapp"
DB_USER="postgres"

# Yedekleme dizini oluştur
mkdir -p $BACKUP_DIR

# Veritabanını yedekle
pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

# 7 günden eski yedekleri sil
find $BACKUP_DIR -name "${DB_NAME}_*.sql" -mtime +7 -delete

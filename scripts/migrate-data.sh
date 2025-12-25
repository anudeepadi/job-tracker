#!/bin/bash

# Data Migration Script for Job Search Platform
# Copies agent outputs from job-search-agent to data/agent-outputs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Data Migration Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Define source and destination directories
SOURCE_DIR="$ROOT_DIR/job-search-agent/outputs"
DEST_DIR="$ROOT_DIR/data/agent-outputs"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Error: Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Create destination directory if it doesn't exist
if [ ! -d "$DEST_DIR" ]; then
    echo -e "${YELLOW}Creating destination directory: $DEST_DIR${NC}"
    mkdir -p "$DEST_DIR"
    echo -e "${GREEN}Destination directory created${NC}"
fi

# Check if there are any files to migrate
FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)

if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No files found in source directory to migrate${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $FILE_COUNT files to migrate${NC}"
echo ""

# Backup existing data if destination is not empty
EXISTING_FILES=$(find "$DEST_DIR" -type f 2>/dev/null | wc -l)

if [ "$EXISTING_FILES" -gt 0 ]; then
    echo -e "${YELLOW}Destination directory already contains files${NC}"
    BACKUP_DIR="${DEST_DIR}_backup_$(date +%s)"
    echo -e "${YELLOW}Creating backup: $BACKUP_DIR${NC}"
    cp -r "$DEST_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}Backup created successfully${NC}"
    echo ""
fi

# Copy files preserving directory structure
echo -e "${YELLOW}Migrating data files...${NC}"
echo ""

# Use rsync for better control over copying with directory structure
rsync -av --progress "$SOURCE_DIR/" "$DEST_DIR/" 2>/dev/null || {
    # Fallback to cp if rsync is not available
    cp -rv "$SOURCE_DIR"/* "$DEST_DIR/" 2>/dev/null
}

echo ""

# Verify migration
MIGRATED_FILES=$(find "$DEST_DIR" -type f | wc -l)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Data Migration Completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Migration Summary:${NC}"
echo "  - Source:       $SOURCE_DIR"
echo "  - Destination:  $DEST_DIR"
echo "  - Files copied: $MIGRATED_FILES"
echo ""

if [ "$EXISTING_FILES" -gt 0 ]; then
    echo -e "${BLUE}Backup Information:${NC}"
    echo "  - Location: $BACKUP_DIR"
    echo ""
fi

# List migrated files
echo -e "${BLUE}Migrated files:${NC}"
find "$DEST_DIR" -type f -exec echo "  - {}" \;

echo ""
echo -e "${GREEN}Migration completed successfully!${NC}"

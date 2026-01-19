/**
 * S3 Client Wrapper for Research Papers MCP Server
 * Provides access to research papers stored in S3
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

class S3ClientWrapper {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: config.aws.region,
    });
    this.bucket = config.s3.researchPapersBucket;
    logger.info('S3 client initialized', { bucket: this.bucket });
  }

  /**
   * Get research paper by ID
   */
  async getPaper(paperId: string): Promise<any | null> {
    try {
      logger.debug('Getting research paper from S3', { paperId });

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: `papers/${paperId}.json`,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const bodyString = await response.Body.transformToString();
      const paper = JSON.parse(bodyString);
      
      logger.debug('Research paper retrieved', { paperId });
      return paper;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        logger.info('Research paper not found', { paperId });
        return null;
      }
      logger.error('Error getting research paper', error as Error, { paperId });
      throw error;
    }
  }

  /**
   * List research papers with optional filtering
   */
  async listPapers(prefix: string = 'papers/', maxKeys: number = 100): Promise<string[]> {
    try {
      logger.debug('Listing research papers', { prefix, maxKeys });

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);
      const paperIds = (response.Contents || [])
        .map(obj => obj.Key?.replace(prefix, '').replace('.json', ''))
        .filter(Boolean) as string[];

      logger.debug('Research papers listed', { count: paperIds.length });
      return paperIds;
    } catch (error) {
      logger.error('Error listing research papers', error as Error);
      throw error;
    }
  }
}

// Singleton instance
export const s3Client = new S3ClientWrapper();

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { config } from '../../config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class OcrService implements OnModuleDestroy {
  private readonly logger = new Logger(OcrService.name);
  private worker: any = null; // Utilisation de 'any' temporairement
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.logger.log('Initializing OCR service...');
    this.initializeWorker().catch((err) => {
      this.logger.error('Initial worker initialization failed', err);
    });
  }

  private async initializeWorker(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        await fs.mkdir(config.ocr.temporary_path, { recursive: true });

        // Création du worker avec la nouvelle API
        this.worker = await createWorker();

        // Chargement et initialisation combinés
        await this.worker.loadAndInitialize(config.ocr.languages.join('+'));

        // Configuration
        await this.worker.setParameters({
          tessedit_pageseg_mode: '3', // PSM.AUTO
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()%-/ÀÂÇÉÈÊËÎÏÔÙÛÜŸàâçéèêëîïôùûüÿ'
        });

        this.logger.log(
          `Tesseract worker initialized for languages: ${config.ocr.languages.join(', ')}`,
        );
      } catch (error) {
        this.logger.error('Worker initialization failed:', error);
        this.worker = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async ensureWorker(): Promise<any> {
    if (!this.worker) {
      await this.initializeWorker();
    }
    if (!this.worker) {
      throw new Error('OCR worker could not be initialized');
    }
    return this.worker;
  }

  async extractTextFromImage(
    imageBuffer: Buffer,
    originalFilename: string,
  ): Promise<{ text: string; confidence: number }> {
    const worker = await this.ensureWorker();
    const tempFilePath = path.join(
      config.ocr.temporary_path,
      `${Date.now()}-${originalFilename}`,
    );

    try {
      await fs.writeFile(tempFilePath, imageBuffer);

      const { data } = await worker.recognize(tempFilePath);
      const minConfidence = config.ocr.minimumConfidence;

      this.logger.debug(`OCR confidence: ${data.confidence.toFixed(1)}%`);

      if (data.confidence < minConfidence) {
        this.logger.warn(
          `Low confidence (${data.confidence.toFixed(1)}% < ${minConfidence}%) for: ${originalFilename}`,
        );
      }

      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error) {
      this.logger.error(`OCR processing failed for ${originalFilename}:`, error);
      throw new Error(`OCR processing failed: ${error.message}`);
    } finally {
      await this.cleanupTempFile(tempFilePath);
    }
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      this.logger.warn(`Failed to delete temp file ${filePath}:`, err);
    }
  }

  analyzePrescriptionText(
    text: string,
  ): {
    medications: Array<{ name: string; dosage: string; instructions: string }>;
    patientInfo: { name?: string; age?: string; other?: string };
    doctor?: string;
    date?: string;
  } {
    const result = {
      medications: [] as Array<{ name: string; dosage: string; instructions: string }>,
      patientInfo: {} as { name?: string; age?: string; other?: string },
      doctor: undefined as string | undefined,
      date: undefined as string | undefined,
    };

    const lines = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    for (const line of lines) {
      if (!result.date) {
        const dateMatch = line.match(
          /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b|(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b.+\d{1,2}.+\d{4}/i,
        );
        if (dateMatch) result.date = dateMatch[0];
      }

      if (!result.doctor && /(^|\s)(Dr\.?|Docteur|Médecin)\b/i.test(line)) {
        result.doctor = line;
      }

      if (/^(nom|name|patient)\s*[:.]/i.test(line)) {
        result.patientInfo.name = line
          .replace(/^(nom|name|patient)\s*[:.]\s*/i, '')
          .trim();
      } else if (/^(âge|age)\s*[:.]/i.test(line)) {
        result.patientInfo.age = line
          .replace(/^(âge|age)\s*[:.]\s*/i, '')
          .trim();
      }

      if (/(\b\d+\s*(mg|ml|g|mcg|UI|µg)\b|[\d½¼¾]+\s*[x×]\s*\d+)/i.test(line)) {
        const med = this.extractMedicationInfo(line);
        if (med) result.medications.push(med);
      }
    }

    return result;
  }

  private extractMedicationInfo(line: string): {
    name: string;
    dosage: string;
    instructions: string;
  } | null {
    const parts = line.split(/\s{2,}|\t/).filter((p) => p.trim());

    let name = '';
    for (let i = 0; i < parts.length; i++) {
      if (/^[A-ZÀ-ÿ]/.test(parts[i])) {
        name = parts.slice(0, i + 1).join(' ');
        break;
      }
    }

    const dosageMatch = line.match(
      /(\d+\s*(mg|ml|g|mcg|UI|µg)\b)|(\d+\s*[x×]\s*\d+\s*(comprimé|cp|goutte|ml)\b)|(\d+\s*fois\s*par\s*jour)/i,
    );
    const dosage = dosageMatch?.[0] || '';

    const instructions = line
      .replace(name, '')
      .replace(dosage, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return name || dosage
      ? {
          name: name || 'Médicament non identifié',
          dosage: dosage || 'Dosage non spécifié',
          instructions: instructions || 'Prendre selon prescription',
        }
      : null;
  }

  async onModuleDestroy() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.logger.log('Tesseract worker terminated');
      } catch (error) {
        this.logger.error('Error terminating worker:', error);
      }
    }

    try {
      const files = await fs.readdir(config.ocr.temporary_path);
      await Promise.all(
        files.map((file) =>
          fs.unlink(path.join(config.ocr.temporary_path, file)),
        ),
      );
      this.logger.log(`Cleaned ${files.length} temporary files`);
    } catch (error) {
      this.logger.warn('Error cleaning temp files:', error);
    }
  }
}
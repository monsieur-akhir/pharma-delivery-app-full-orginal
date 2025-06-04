// src/bull/processors/ocr.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrescriptionsService } from '../../prescriptions/prescriptions.service';
import * as fs from 'fs-extra';
import * as path from 'path';

// on bypasse les définitions TS pour accéder à createWorker
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Tesseract: any = require('tesseract.js');

export interface OcrJob {
  prescriptionId: number;
  userId: number;
  imagePath: string;
  languages?: string[];
}

export interface OcrResult {
  prescriptionId: number;
  userId: number;
  text: string;
  confidence: number;
  structuredData: {
    patientName?: string;
    doctorName?: string;
    medications?: Array<{
      name?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    }>;
    date?: string;
    notes?: string;
  };
  originalImagePath: string;
  processedAt: Date;
}

@Injectable()
@Processor('ocr')
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);
  private readonly supportedLanguages: string[];
  private readonly minConfidence: number;
  private readonly tessdataPath: string;
  private readonly workerOptions: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prescriptionsService: PrescriptionsService,
  ) {
    this.supportedLanguages =
      this.configService.get<string[]>('OCR_SUPPORTED_LANGUAGES', ['eng', 'fra']);
    this.minConfidence = this.configService.get<number>('OCR_MIN_CONFIDENCE', 0.7);

    // répertoire où vous aurez copié vos *.traineddata
    this.tessdataPath = this.configService.get<string>(
      'OCR_TESSDATA_PATH',
      path.resolve(process.cwd(), 'tessdata'),
    );
    fs.ensureDirSync(this.tessdataPath);

    // chemin vers le fichier WASM de Tesseract
    const coreWasm = this.configService.get<string>(
      'OCR_CORE_PATH',
      require.resolve('tesseract.js-core/tesseract-core.wasm.js'),
    );

    // options passées au worker
    this.workerOptions = {
      corePath: coreWasm,
      langPath: this.tessdataPath,
      cacheMethod: 'readWrite',
      logger: (m: any) => {
        // m.status, m.progress
        this.logger.debug(`Tesseract (${m.status}): ${(m.progress * 100).toFixed(0)}%`);
      },
    };
  }

  @Process('process-prescription-image')
  async processImage(job: Job<OcrJob>): Promise<OcrResult> {
    const { prescriptionId, userId, imagePath, languages = ['eng'] } = job.data;
    this.logger.log(`Starting OCR for prescription #${prescriptionId}, user #${userId}`);
    job.progress(0);

    if (!prescriptionId || !userId || !imagePath) {
      throw new Error('Missing required OCR job parameters');
    }
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at path: ${imagePath}`);
    }

    const validLanguages = languages.filter(lang =>
      this.supportedLanguages.includes(lang),
    );
    if (!validLanguages.length) {
      this.logger.warn(
        `No valid languages provided, falling back to ${this.supportedLanguages[0]}`,
      );
      validLanguages.push(this.supportedLanguages[0]);
    }
    const langCombined = validLanguages.join('+');

    // création et initialisation du worker
    const worker = await Tesseract.createWorker(this.workerOptions);
    await worker.load();
    await worker.loadLanguage(langCombined);
    await worker.initialize(langCombined);
    await worker.setParameters({
      // mode single block = '6'
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
    });

    // reconnaissance
    const { data } = await worker.recognize(imagePath);
    job.progress(100);
    await worker.terminate();

    if (data.confidence < this.minConfidence) {
      this.logger.warn(
        `Low confidence (${data.confidence.toFixed(2)}) for prescription #${prescriptionId}`,
      );
    }

    const structuredData = this.extractStructuredData(data.text);
    const result: OcrResult = {
      prescriptionId,
      userId,
      text: data.text,
      confidence: data.confidence,
      structuredData,
      originalImagePath: imagePath,
      processedAt: new Date(),
    };

    await this.prescriptionsService.updateOcrResults(prescriptionId, result);
    this.logger.log(`OCR completed for prescription #${prescriptionId}`);
    return result;
  }

  private extractStructuredData(text: string): OcrResult['structuredData'] {
    const result: OcrResult['structuredData'] = { medications: [] };
    try {
      const patientMatch = text.match(/Patient\s*:?\s*([\w\s]+)/i);
      if (patientMatch?.[1]) result.patientName = patientMatch[1].trim();

      const doctorMatch = text.match(
        /Dr\.?\s*([\w\s]+)|Doctor\s*:?\s*([\w\s]+)/i,
      );
      if (doctorMatch) result.doctorName = (doctorMatch[1] || doctorMatch[2]).trim();

      const dateMatch = text.match(
        /(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/,
      );
      if (dateMatch) result.date = dateMatch[1];

      const lines = text.split('\n');
      for (const line of lines) {
        const medMatch = line.match(
          /([A-Za-zÀ-ÿ\s]+)\s+(\d+\s*(?:mg|ml|mcg|g))/i,
        );
        if (!medMatch) continue;
        const med: any = {
          name: medMatch[1].trim(),
          dosage: medMatch[2].trim(),
        };
        const freq = line.match(
          /(\b\d+\s*times\b|\bonce\b|\btwice\b|\bthree times\b|\bevery\s*\d+\s*hours\b)/i,
        );
        if (freq) med.frequency = freq[0].trim();

        const dur = line.match(/for\s*(\d+\s*(?:days?|weeks?|months?))/i);
        if (dur) med.duration = dur[1].trim();

        result.medications!.push(med);
      }

      const notesMatch = text.match(/Notes\s*:?\s*([\s\S]+)$/i);
      if (notesMatch) result.notes = notesMatch[1].trim();
    } catch (parseErr) {
      this.logger.error(`Error parsing structured data: ${parseErr.message}`);
    }
    return result;
  }
}

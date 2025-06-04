// src/bull/processors/prescription-analysis.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrescriptionsService } from '../../prescriptions/prescriptions.service';
import OpenAI from 'openai';
import { OcrResult } from './ocr.processor';

export interface PrescriptionAnalysisJob {
  prescriptionId: number;
  userId: number;
  ocrResult: OcrResult;
}

export interface PrescriptionAnalysisResult {
  prescriptionId: number;
  userId: number;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    potentialInteractions?: string[];
    sideEffects?: string[];
    contraindications?: string[];
    alternatives?: string[];
  }>;
  notes: string;
  warnings: string[];
  recommendedTests?: string[];
  processedAt: Date;
}

@Injectable()
@Processor('prescription-analysis')  // <== aligné ici aussi
export class PrescriptionAnalysisProcessor {
  private readonly logger = new Logger(PrescriptionAnalysisProcessor.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prescriptionsService: PrescriptionsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not set. AI prescription analysis will not work.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  @Process('analyze-prescription')
  async analyzePrescription(
    job: Job<PrescriptionAnalysisJob>
  ): Promise<PrescriptionAnalysisResult> {
    const { prescriptionId, userId, ocrResult } = job.data;
    this.logger.log(`Analyzing prescription #${prescriptionId} for user #${userId}`);

    try {
      // Validation des données
      if (!prescriptionId || !userId || !ocrResult) {
        throw new Error('Missing required prescription analysis job parameters');
      }
      const prescriptionText = ocrResult.text;
      if (!prescriptionText?.trim()) {
        throw new Error('Empty prescription text in OCR result');
      }

      // Construction du prompt et appel à OpenAI
      const prompt = this.buildAnalysisPrompt(ocrResult);
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a highly trained pharmaceutical assistant specializing in prescription analysis. ' +
              'Analyze the prescription data and provide detailed, structured information ' +
              'about medications, potential interactions, side effects, and recommendations. ' +
              'Format your response as valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const responseContent = completion.choices[0].message.content;
      const analysisData = JSON.parse(responseContent);

      // Montage du résultat
      const result: PrescriptionAnalysisResult = {
        prescriptionId,
        userId,
        medications: this.formatMedications(analysisData.medications || []),
        notes: analysisData.notes || '',
        warnings: analysisData.warnings || [],
        recommendedTests: analysisData.recommendedTests || [],
        processedAt: new Date(),
      };

      // Sauvegarde dans la base
      await this.prescriptionsService.updateAnalysisResults(prescriptionId, result);
      this.logger.log(`Successfully analyzed prescription #${prescriptionId}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to analyze prescription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /** Crée le prompt détaillé pour l’analyse */
  private buildAnalysisPrompt(ocrResult: OcrResult): string {
    const { text, structuredData } = ocrResult;
    let prompt = `Analyze the following prescription information:\n\n`;

    if (structuredData) {
      prompt += `Patient: ${structuredData.patientName || 'Unknown'}\n`;
      prompt += `Doctor: ${structuredData.doctorName || 'Unknown'}\n`;
      prompt += `Date: ${structuredData.date || 'Unknown'}\n\n`;

      if (structuredData.medications?.length) {
        prompt += `Medications detected:\n`;
        structuredData.medications.forEach((med, i) => {
          prompt += `${i + 1}. ${med.name || 'Unknown'} ${med.dosage || ''} ` +
                    `${med.frequency || ''} ${med.duration || ''}\n`;
        });
        prompt += `\n`;
      }
      if (structuredData.notes) {
        prompt += `Notes: ${structuredData.notes}\n\n`;
      }
    }

    prompt += `Full prescription text:\n${text}\n\n`;
    prompt += `Please provide a detailed analysis in JSON format with the following structure:
{
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage information",
      "frequency": "how often to take",
      "duration": "how long to take",
      "potentialInteractions": ["list of potential interactions"],
      "sideEffects": ["common side effects"],
      "contraindications": ["situations where this medication should not be used"],
      "alternatives": ["potential alternative medications"]
    }
  ],
  "notes": "general notes about the prescription",
  "warnings": ["important warnings about the medications or combinations"],
  "recommendedTests": ["any tests that might be recommended while on these medications"]
}`;
    return prompt;
  }

  /** Formate la liste des médicaments pour garantir les champs */
  private formatMedications(
    medications: any[]
  ): PrescriptionAnalysisResult['medications'] {
    return medications.map(med => ({
      name: med.name || 'Unknown',
      dosage: med.dosage || 'Not specified',
      frequency: med.frequency || 'Not specified',
      duration: med.duration || 'Not specified',
      potentialInteractions: med.potentialInteractions || [],
      sideEffects: med.sideEffects || [],
      contraindications: med.contraindications || [],
      alternatives: med.alternatives || [],
    }));
  }
}

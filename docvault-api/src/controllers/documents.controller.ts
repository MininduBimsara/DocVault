import { Request, Response, NextFunction } from "express";
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
} from "../services/documents.service";

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      res
        .status(400)
        .json({ error: "No file uploaded. Use field name `file`." });
      return;
    }

    const document = await uploadDocument(userId, req.file);

    console.log(
      `[upload] userId=${userId} docId=${document.id} size=${req.file.size}B`,
    );

    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listDocumentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const documents = await listDocuments(userId);
    res.status(200).json({ documents });
  } catch (err) {
    next(err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { docId } = req.params;

    await deleteDocument(userId, docId);

    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    // Surface known 404 from service as a proper HTTP response
    if ((err as any).statusCode === 404) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    next(err);
  }
}

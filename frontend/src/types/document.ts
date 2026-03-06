export interface Document {
  id: string;
  fileName: string;
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  progress?: {
    totalPages?: number;
    chunksTotal?: number;
    chunksDone?: number;
    stage?: string;
  };
  createdAt: string;
}

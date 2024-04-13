import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.mjs";
import { type Readable } from "stream";

// Make sure to move uploadJsonl, generateBlobDownloadUrl from azure

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID_JSONL,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY_JSONL,
  }
});

export const generateAWSBlobUploadUrl = async (blobName: string) => {
  const bucketName = env.AWS_BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log("signedUrl:",signedUrl)
  return signedUrl;
};


export async function downloadBlobToStrings({
                                              blobName,
                                              maxEntriesToImport,
                                              onProgress,
                                              chunkInterval,
                                            }: {
  blobName: string;
  maxEntriesToImport: number;
  onProgress: (progress: number) => Promise<void>;
  chunkInterval?: number;
}) {

  const bucketName = env.AWS_BUCKET_NAME;

  console.log("bucketName",bucketName)
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });

  const { Body } = await s3Client.send(command);
  console.log("Done with extracting blob")

  if (!Body) throw Error("Failed to download blob or no body in response");

  return streamToNdStrings({
    readableStream: Body as Readable,
    maxEntriesToImport,
    onProgress,
    chunkInterval,
  });

}

// Splits the stream into individual chunks split on newlines
async function streamToNdStrings({
                                   readableStream,
                                   maxEntriesToImport,
                                   onProgress,
                                   chunkInterval = 1048576, // send progress every 1MB
                                 }: {
  readableStream: NodeJS.ReadableStream;
  maxEntriesToImport: number;
  onProgress?: (progress: number) => Promise<void>;
  chunkInterval?: number;
}): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    let bytesDownloaded = 0;
    let lastReportedByteCount = 0;
    let tempBuffer: Buffer = Buffer.alloc(0);
    let numEntriesImported = 0;

    readableStream.on("data", (chunk: Buffer) => {
      bytesDownloaded += chunk.byteLength;

      // Report progress
      if (onProgress && bytesDownloaded - lastReportedByteCount >= chunkInterval) {
        void onProgress(bytesDownloaded);
        lastReportedByteCount = bytesDownloaded;
      }

      // Combine with leftover buffer from previous chunk
      chunk = Buffer.concat([tempBuffer, chunk]);

      let newlineIndex;
      while (
        (newlineIndex = chunk.indexOf(0x0a)) !== -1 &&
        numEntriesImported < maxEntriesToImport
        ) {
        const line = chunk.slice(0, newlineIndex).toString("utf-8");
        lines.push(line);
        chunk = chunk.slice(newlineIndex + 1);
        numEntriesImported++;
      }

      if (numEntriesImported >= maxEntriesToImport) {
        // TODO: cancel the stream
        resolve(lines);
        return;
      }

      // Save leftover data for next chunk
      tempBuffer = chunk;
    });

    readableStream.on("end", () => {
      if (tempBuffer.length > 0) {
        lines.push(tempBuffer.toString("utf-8")); // add the last part
      }
      resolve(lines);
    });

    readableStream.on("error", reject);
  });
}

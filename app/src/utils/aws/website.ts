import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "~/state/store";
import { inverseDatePrefix } from "./utils";

export const uploadDatasetEntryFile = async (projectId: string, file: File) => {

  const { api } = useAppStore.getState();
  if (!api) throw Error("API not initialized");

  const basename = file.name.split(".").shift();
  if (!basename) throw Error("basename not found");

  const blobName = `${inverseDatePrefix()}-${basename}-${uuidv4()}-uploaded.jsonl`;
  const { serviceClientUrl } = await api.client.datasets.getAWSServiceClientUrl.query({ projectId, blobName });

  await fetch(serviceClientUrl, {
    method: 'PUT',
    headers: {
       'Content-Type': 'application/octet-stream',
       'Accept': 'application/xml'
    },
    body: file

  });

  return blobName;
};

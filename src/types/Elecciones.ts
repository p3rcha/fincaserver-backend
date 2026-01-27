export interface EleccionData {
  mc_name: string;
  nombre_partido: string;
  bandera_url: string;
  comentarios?: string | null;
  attachment_url?: string | null;
  ip_address?: string | null;
  device_fingerprint?: string | null;
  user_agent?: string | null;
}

export interface EleccionSubmission {
  mcName: string;
  nombrePartido: string;
  banderaUrl: string;
  comentarios?: string;
  attachmentUrl?: string;
}

export type AdminReport = {
  id: string;
  type: string;
  range?: string | null;
  generatedAt: string;
  filename?: string | null;
};

export type AdminReportsListResponse = {
  data: AdminReport[];
};

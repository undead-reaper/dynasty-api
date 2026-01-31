import type { MatchSelectSchema } from "@/drizzle/schemas/matches";
import { MATCH_STATUS } from "@/validations/matches";
import type z from "zod";

type getMatchStatusParams = Readonly<{
  startTime: Date | null;
  endTime: Date | null;
  now?: Date;
}>;

export const getMatchStatus = ({
  startTime,
  endTime,
  now = new Date(),
}: getMatchStatusParams) => {
  if (!startTime || !endTime) {
    return null;
  }
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  } else if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  } else if (now >= start && now <= end) {
    return MATCH_STATUS.LIVE;
  } else {
    return MATCH_STATUS.FINISHED;
  }
};

type SyncMatchStatusParams = Readonly<{
  match: z.infer<typeof MatchSelectSchema>;
  updateStatus: (status: z.infer<typeof MATCH_STATUS>) => Promise<void>;
}>;

export const syncMatchStatus = async ({
  match,
  updateStatus,
}: SyncMatchStatusParams) => {
  const nextStatus = getMatchStatus({
    startTime: match.startTime,
    endTime: match.endTime,
  });
  if (!nextStatus) {
    return match.status;
  } else if (nextStatus !== match.status) {
    await updateStatus(nextStatus);
    match.status === nextStatus;
  } else {
    return match.status;
  }
};

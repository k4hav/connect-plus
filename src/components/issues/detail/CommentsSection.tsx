import { Trash2 } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { addComment, deleteOwnComment, moderateComment } from "@/lib/actions/discussion";
import { COMMENT_PAGE_SIZE } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { ReportContent } from "./ReportContent";

type Comment = {
  id: string;
  user_id: string;
  comment: string;
  moderation_status: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

export function CommentsSection({
  issueId,
  comments,
  total,
  page,
  currentUserId,
  isStaff,
}: {
  issueId: string;
  comments: Comment[];
  total: number;
  page: number;
  currentUserId: string;
  isStaff: boolean;
}) {
  return (
    <section id="comments" aria-labelledby="comments-h" className="glass rounded-2xl p-5">
      <h2 id="comments-h" className="text-lg font-medium">
        Discussion <span className="text-sm font-normal text-muted">({total})</span>
      </h2>
      <p className="mt-1 text-xs text-muted">Keep it constructive. Harassment, spam, personal attacks and private information are removed.</p>

      <ActionForm action={addComment.bind(null, issueId)} submitLabel="Post comment" className="mt-4 space-y-3">
        <Textarea name="comment" label="Add a comment or suggestion" rows={3} maxLength={2000} />
      </ActionForm>

      {comments.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No comments yet. Share relevant information or a constructive suggestion.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {comments.map((c) => {
            const mine = c.user_id === currentUserId;
            const hidden = c.moderation_status !== "visible";
            return (
              <li key={c.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                  <span className="font-medium text-ink">{c.profiles?.full_name ?? "Student"}</span>
                  <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                  {hidden && <Badge tone="red">{c.moderation_status === "removed" ? "Removed" : "Hidden"} by moderator</Badge>}
                </div>
                <p className={`mt-1.5 whitespace-pre-wrap break-words text-sm ${hidden ? "text-white/40" : "text-muted"}`}>{c.comment}</p>
                <div className="mt-2 flex flex-wrap items-start gap-4">
                  {!mine && !hidden && <ReportContent type="comment" id={c.id} issueId={issueId} />}
                  {mine && (
                    <form action={deleteOwnComment.bind(null, issueId, c.id)}>
                      <button className="inline-flex items-center gap-1 text-xs text-white/35 hover:text-danger">
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                      </button>
                    </form>
                  )}
                  {isStaff && (
                    <div className="flex gap-3 text-xs">
                      {hidden ? (
                        <form action={moderateComment.bind(null, c.id, "visible", issueId)}>
                          <button className="text-amber hover:underline">Restore</button>
                        </form>
                      ) : (
                        <>
                          <form action={moderateComment.bind(null, c.id, "hidden", issueId)}>
                            <button className="text-amber hover:underline">Hide</button>
                          </form>
                          <form action={moderateComment.bind(null, c.id, "removed", issueId)}>
                            <button className="text-danger hover:underline">Remove</button>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} total={total} pageSize={COMMENT_PAGE_SIZE} basePath={`/issues/${issueId}`} pageParam="cpage" />
    </section>
  );
}
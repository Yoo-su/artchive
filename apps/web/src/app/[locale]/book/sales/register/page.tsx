import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { BookSellView } from "@/views/book-sale-form-view";

export default function Page() {
  return (
    <AuthGuard>
      <BookSellView />
    </AuthGuard>
  );
}

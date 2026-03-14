import { Action, Content, ImageArea, Meta, Tags, Title } from "./parts";
import { Root } from "./root";
import { ReviewCardSkeleton } from "./skeleton";

export const ReviewCard = {
  Root,
  Image: ImageArea,
  Content,
  Meta,
  Title,
  Tags,
  Action,
  Skeleton: ReviewCardSkeleton,
};

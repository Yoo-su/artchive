"use client";

import { Review } from "@bookjeok/core";
import React from "react";

import { Action, Content, ImageArea, Meta, Tags, Title } from "./parts";
import { Root } from "./root";
import { ReviewCardSkeleton } from "./skeleton";

export interface FlatReviewCardProps {
  review: Review;
  className?: string;
  href?: string;
  asLink?: boolean;
  priority?: boolean;
}

/**
 * 기본 표준 레이아웃을 제공하는 Flat ReviewCard 컴포넌트입니다. (토스 하이브리드 패턴)
 * 커스텀 레이아웃이 필요한 경우 ReviewCard.Root 등의 Compound 하위 컴포넌트를 직접 조립할 수 있습니다.
 */
export function ReviewCard({
  review,
  className,
  href,
  asLink = true,
  priority = false,
}: FlatReviewCardProps) {
  return (
    <Root
      review={review}
      className={className}
      href={href}
      asLink={asLink}
      priority={priority}
    >
      <ImageArea />
      <Content>
        <Meta />
        <Title />
        <Tags />
        <Action />
      </Content>
    </Root>
  );
}

ReviewCard.Root = Root;
ReviewCard.Image = ImageArea;
ReviewCard.Content = Content;
ReviewCard.Meta = Meta;
ReviewCard.Title = Title;
ReviewCard.Tags = Tags;
ReviewCard.Action = Action;
ReviewCard.Skeleton = ReviewCardSkeleton;

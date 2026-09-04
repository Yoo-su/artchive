import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateBookSaleDto } from './create-book-sale.dto';

/**
 * 판매글 수정 입력.
 *
 * `isbn`은 제외합니다. 판매글이 어떤 책인지는 등록 시점에 정해지는 사실이고,
 * 나중에 바꿀 수 있으면 거래 후기가 달린 판매글의 책을 통째로 갈아끼울 수
 * 있습니다(`BookResolvePipe`를 타지 않아 존재하지 않는 ISBN이면 FK 위반으로
 * 500이 나기도 합니다). 다른 책을 팔려면 새 글을 씁니다.
 */
export class UpdateBookSaleDto extends PartialType(
  OmitType(CreateBookSaleDto, ['isbn'] as const),
) {}

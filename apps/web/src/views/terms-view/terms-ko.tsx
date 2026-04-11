export const TermsKo = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>시행일자: 2026년 1월 1일</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 1 조 (목적)</h2>
        <p>
          본 약관은 북적(bookjeok) 서비스(이하 '서비스')의 이용과 관련하여, 운영자와 사용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <p className="font-medium text-stone-900 bg-stone-100 p-3 rounded-lg border border-stone-200">
          본 서비스는 책과 독서를 사랑하는 사용자들에게 가치를 제공하기 위해 무료로 운영되는 플랫폼입니다. (단, 서버 운영 및 지속적인 서비스 제공을 위해 일부 광고가 포함될 수 있습니다.)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 2 조 (약관의 효력 및 변경)</h2>
        <ul className="list-decimal list-inside space-y-2 ml-2">
          <li>본 약관은 서비스를 이용하고자 하는 모든 사용자에게 효력을 발생합니다.</li>
          <li>운영자는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 약관을 개정할 수 있습니다.</li>
          <li>약관이 변경될 경우 운영자는 이를 서비스 내에 공지하며, 사용자가 서비스를 계속 이용할 경우 동의한 것으로 간주합니다.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 3 조 (사용자의 의무)</h2>
        <p>사용자는 서비스를 이용함에 있어 다음의 행위를 하여서는 안 됩니다.</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>타인의 정보 도용 (소셜 로그인 계정 도용 포함)</li>
          <li>서비스의 운영을 고의로 방해하는 행위</li>
          <li>스팸, 광고성 콘텐츠, 욕설, 혐오 표현 등 부적절한 콘텐츠를 게시하는 행위</li>
          <li>지적 재산권을 침해하는 콘텐츠(무단 복제 도서 정보 등)를 업로드하는 행위</li>
        </ul>
        <p className="text-sm border-l-4 border-red-400 pl-3 text-stone-500 mt-4">
          * 부적절한 콘텐츠 작성 및 행위 적발 시, 운영자 권한으로 사전 통보 없이 해당 게시물 삭제 및 계정 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 4 조 (게시물의 저작권 및 관리)</h2>
        <ul className="list-decimal list-inside space-y-2 ml-2">
          <li>사용자가 서비스 내에 게시한 리뷰, 중고책 판매글 등(이하 '게시물')의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</li>
          <li>운영자는 사용자의 게시물을 서비스 노출(검색, 큐레이션, 피드 제공 등)의 목적으로 활용할 수 있습니다.</li>
          <li>본 서비스의 인프라 및 스토리지 용량 문제로 인하여 생성된 게시물이나 이미지는 사전 예고 없이 삭제될 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 5 조 (면책 조항)</h2>
        <p>
          본 서비스는 사용자에게 무료로 제공되고 있으며, 플랫폼 제공의 특성상 다음과 같은 상황에 대해 운영자는 어떠한 법적, 금전적 책임을 지지 않습니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>천재지변, 서버 제공업체의 장애, API 할당량 소진 등으로 인한 서비스 중단</li>
          <li>데이터베이스 오류, 스토리지 만료 등으로 인한 사용자 데이터(독서 기록, 리뷰, 이미지 등)의 영구적 소실</li>
          <li>사용자 간 일어난 분쟁(중고책 거래 중 발생한 사기, 금전적 손실 포함)</li>
          <li>기타 운영자의 고의나 중과실이 없는 모든 형태의 손해</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 6 조 (준거법 및 재판관할)</h2>
        <p>
          서비스 이용과 관련하여 운영자와 사용자 간에 발생한 분쟁에 대하여는 대한민국 법을 적용하며, 분쟁이 발생하여 소송이 제기될 경우 운영자의 주소지를 관할하는 법원을 전속 관할법원으로 합니다.
        </p>
      </section>
    </>
  );
};

export const PrivacyKo = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>시행일자: 2026년 1월 1일</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 1 조 (개인정보의 처리 목적)</h2>
        <p>
          북적(bookjeok)(이하 ‘서비스’)은 개인정보를 다음의 목적을 위해 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>회원 가입 및 관리:</strong> 회원 식별, 서비스 부정 이용 방지, 각종 고지 및 통지</li>
          <li><strong>서비스 제공:</strong> 도서 리뷰 작성, 중고책 거래 기능 제공 등 서비스의 핵심 기능 운영</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 2 조 (수집하는 개인정보의 항목 및 수집 방법)</h2>
        <p>서비스는 회원가입 및 원활한 서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>필수 수집 항목:</strong> 로그인 이메일, 닉네임(또는 이름), 프로필 이미지</li>
          <li><strong>수집 방법:</strong> 소셜 로그인(카카오, 네이버) API를 통한 자동 수집 및 이메일 직접 가입 시 사용자 입력</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 3 조 (개인정보의 처리 및 보유 기간)</h2>
        <p>
          원칙적으로, 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>보유 기간:</strong> 회원 가입일로부터 회원 탈퇴 시까지</li>
          <li>회원 탈퇴 시, 사용자의 모든 식별 가능 개인정보는 즉각 파기되거나 익명화 처리됩니다.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 4 조 (개인정보의 제3자 제공 여부)</h2>
        <p>
          본 서비스는 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 사용자 데이터를 상업적으로 활용하거나 제3자에게 매각하지 않습니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 5 조 (정보주체의 권리, 의무 및 그 행사방법)</h2>
        <p>사용자는 다음과 같은 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>이용자는 언제든지 '마이페이지'를 통해 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
          <li>이용자는 마이페이지 내의 '회원 탈퇴: Danger Zone' 기능을 통해 개인정보의 수집 및 이용 동의를 철회할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">제 6 조 (개인정보 관리 책임자)</h2>
        <p>
          개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className="bg-stone-50 p-4 rounded-lg text-sm">
          <ul className="space-y-1">
            <li><strong>이메일:</strong> rhan0871@naver.com</li>
            <li><strong>책임자:</strong> 북적 서비스 운영자</li>
          </ul>
        </div>
      </section>
    </>
  );
};

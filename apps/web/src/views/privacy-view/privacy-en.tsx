export const PrivacyEn = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>Effective Date: January 1, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 1 (Purpose of Processing Personal Information)</h2>
        <p>
          Bookjeok (the "Service") processes personal information for the following purposes. The processed personal information will not be used for purposes other than the following, and prior consent will be sought if the purpose of use changes.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>Membership Registration and Management:</strong> User identification, prevention of fraudulent use of the service, and various notices.</li>
          <li><strong>Service Provision:</strong> Operating core functions of the service such as writing book reviews and providing used book trading features.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 2 (Items of Personal Information Collected and Methods of Collection)</h2>
        <p>The Service collects the minimum necessary personal information for membership registration and smooth service provision.</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>Required Items:</strong> Login email, nickname (or name), and profile image.</li>
          <li><strong>Collection Method:</strong> Automatic collection through social login (Kakao, Naver) APIs, and user input during email registration.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 3 (Processing and Retention Period of Personal Information)</h2>
        <p>
          In principle, personal information is destroyed without delay after the purpose of collection and use is achieved.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>Retention Period:</strong> From the date of membership registration until membership withdrawal.</li>
          <li>Upon withdrawal, all identifiable personal information of the user is immediately destroyed or anonymized.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 4 (Provision of Personal Information to Third Parties)</h2>
        <p>
          As a matter of principle, this Service does not provide the personal information of the user to outside parties. This Service does not commercially utilize user data or sell it to third parties.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 5 (Rights and Duties of the Data Subject and Methods of Exercise)</h2>
        <p>Users may exercise the following rights:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Users can view or modify their personal information at any time through 'My Page'.</li>
          <li>Users can withdraw their consent to the collection and use of personal information through the 'Withdrawal: Danger Zone' feature in My Page.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Article 6 (Chief Privacy Officer)</h2>
        <p>
          To protect users' personal information and answer inquiries related to personal information, the Service designates following contact information for the Chief Privacy Officer.
        </p>
        <div className="bg-stone-50 p-4 rounded-lg text-sm">
          <ul className="space-y-1">
            <li><strong>Email:</strong> rhan0871@naver.com</li>
            <li><strong>Officer:</strong> Bookjeok Service Operator</li>
          </ul>
        </div>
      </section>
    </>
  );
};

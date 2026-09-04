export const TermsEn = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>Effective Date: January 1, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 1 (Purpose)
        </h2>
        <p>
          These Terms of Service ("Terms") aim to define the rights,
          obligations, and responsibilities between the operator and the user
          regarding the use of the Bookjeok service (the "Service").
        </p>
        <p className="font-medium text-stone-900 bg-stone-100 p-3 rounded-lg border border-stone-200">
          This Service is provided free of charge to offer value and a community
          for users who love books and reading. (Note: Some advertisements may
          be included to cover server operation and maintenance costs.)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 2 (Effect and Modification of Terms)
        </h2>
        <ul className="list-decimal list-inside space-y-2 ml-2">
          <li>
            These Terms take effect for all users who wish to use the Service.
          </li>
          <li>
            The operator may amend these Terms within the scope not violating
            relevant laws when reasonable grounds arise.
          </li>
          <li>
            When the Terms are modified, the operator will announce it within
            the Service. Continuous use of the Service after such notification
            will be deemed as acceptance of the modified Terms.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 3 (User Obligations)
        </h2>
        <p>
          Users must not engage in the following activities while using the
          Service:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Stealing or misusing another person's information (including social
            login accounts).
          </li>
          <li>Intentionally interfering with the operation of the Service.</li>
          <li>
            Posting inappropriate content such as spam, advertising materials,
            profanity, or hate speech.
          </li>
          <li>
            Uploading content that infringes on intellectual property rights.
          </li>
        </ul>
        <p className="text-sm border-l-4 border-red-400 pl-3 text-stone-500 mt-4">
          * If inappropriate content or behavior is detected, the operator
          reserves the right to delete the content and restrict the account
          without prior notice.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 4 (Copyright and Management of Posts)
        </h2>
        <ul className="list-decimal list-inside space-y-2 ml-2">
          <li>
            Copyright of reviews, used book sales posts, and other contents (the
            "Posts") created by users within the Service belongs to the
            respective creator.
          </li>
          <li>
            The operator may utilize the user's Posts for the purpose of
            exposing them within the Service (such as search, curation, and
            providing feeds).
          </li>
          <li>
            Due to infrastructure and storage limitations of this Service,
            created Posts or uploaded images may be deleted without prior
            notice.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 5 (Disclaimer)
        </h2>
        <p>
          Since this Service is provided free of charge, the operator assumes no
          legal or financial responsibility for the following situations:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Service interruption due to natural disasters, server provider
            failures, or API quota exhaustion.
          </li>
          <li>
            Permanent loss of user data (reading logs, reviews, images, etc.)
            due to database errors or storage expiration.
          </li>
          <li>
            Disputes between users (including fraud or financial loss occurring
            during used book trading).
          </li>
          <li>
            Any other damages that occur without intentional misconduct or gross
            negligence on the part of the operator.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 6 (Governing Law and Jurisdiction)
        </h2>
        <p>
          Any disputes arising between the operator and the user regarding the
          use of the Service shall be governed by the laws of the Republic of
          Korea. In the event of a lawsuit, the competent court shall be the
          court having jurisdiction over the operator's address.
        </p>
      </section>
    </>
  );
};

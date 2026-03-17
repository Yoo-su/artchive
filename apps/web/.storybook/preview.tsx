import "../src/styles/globals.css";

import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";

import messages from "../src/shared/i18n/messages/ko.json";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;

import { expect, Page } from "@playwright/test";
import * as dotenv from "dotenv";

import { getActivities } from "./activity.utils";

dotenv.config({ path: ".env.testing" });

export async function ensureFirstActivityIsRecentTransaction(page: Page, message: string) {
  const activitiesList = await getActivities(page);
  const element = await activitiesList.elementHandles();
  const elemText = await element[0].innerText();
  expect(elemText).toContain(message);
}

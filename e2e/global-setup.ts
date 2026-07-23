import { prepareE2eEnvironment } from "./helpers/env";

export default async function globalSetup() {
  await prepareE2eEnvironment();
}

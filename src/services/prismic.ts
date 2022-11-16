import { createClient } from '@prismicio/client';
// import { HttpRequestLike } from '@prismicio/client';
// import { enableAutoPreviews } from '@prismicio/next';

// export interface PrismicConfig {
//   req?: HttpRequestLike;
// }

// export function getPrismicClient(config: PrismicConfig): prismic.Client {
//   const client = prismic.createClient(process.env.PRISMIC_API_ENDPOINT);

//   enableAutoPreviews({
//     client,
//     req: config.req,
//   })

//   return client;
// }

export const prismic = createClient(process.env.PRISMIC_ENDPOINT, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN,
});

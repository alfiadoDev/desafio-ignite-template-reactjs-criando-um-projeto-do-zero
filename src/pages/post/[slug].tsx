import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { ReactElement } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post?.data.content.reduce((total, contentItem) => {
    if (contentItem.heading) {
      // eslint-disable-next-line no-param-reassign
      total += contentItem.heading.split(' ').length;
    }

    const words = contentItem.body.map(item => item.text.split(' ').length);
    // eslint-disable-next-line no-return-assign, no-param-reassign
    words.map(word => (total += word));

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  const formattedDate = format(
    new Date(post?.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>spacetraveling. | Post</title>
      </Head>

      <img src={post.data.banner.url} alt="banner" className={styles.banner} />

      <main className={commonStyles.container}>
        <div className={styles.content}>
          <h1>{post.data.title}</h1>

          <section className={styles.contentInfo}>
            <span>
              <FiCalendar /> <time>{formattedDate}</time>
            </span>
            <span>
              <FiUser /> {post.data.author}
            </span>
            <span>
              <FiClock /> {readTime} min
            </span>
          </section>

          {post.data.content.map(content => (
            <article key={content.heading} className={styles.post}>
              <h2>{content.heading}</h2>
              <div
                className={styles.postContent}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title:
        typeof response.data.title === 'string'
          ? response.data.title
          : response.data.title[0].text,
      subtitle:
        typeof response.data.subtitle === 'string'
          ? response.data.subtitle
          : response.data.subtitle[0].text,
      author:
        typeof response.data.author === 'string'
          ? response.data.author
          : response.data.author[0].text,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading:
            typeof content.heading === 'string'
              ? content.heading
              : content.heading[0].text,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};

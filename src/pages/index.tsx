import { format } from 'date-fns';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ReactElement, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const formatedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formatedPosts);
  const [netxPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && netxPage === null) return;

    const postsResults = await fetch(`${netxPage}`).then(response =>
      response.json()
    );

    setNextPage(postsResults.nextPage);
    setCurrentPage(postsResults.page);

    const newPost = postsResults.results.map(post => {
      return {
        uid: post.uid,
        data: {
          title:
            typeof post.data.title !== 'string'
              ? post.data.title[0].text
              : post.data.title,
          subtitle:
            typeof post.data.title !== 'string'
              ? post.data.subtitle[0].text
              : post.data.subtitle,
          author:
            typeof post.data.title !== 'string'
              ? post.data.author[0].text
              : post.data.author,
        },
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts([...posts, ...newPost]);
  }

  return (
    <>
      <Head>
        <title>spacetraveling. | Home</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>

                <div>
                  <span>
                    <FiCalendar /> <time>{post.first_publication_date}</time>
                  </span>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {netxPage && (
            <button
              type="button"
              onClick={() => {
                handleNextPage();
              }}
              className={styles.button}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.getByType('posts', {
    fetch: [
      'posts.title',
      'posts.subtitle',
      'posts.author',
      'posts.banner',
      'posts.content',
    ],
    pageSize: 1,
    orderings: {
      field: 'document.last_publication_date',
      direction: 'desc',
    },
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title:
          typeof post.data.title !== 'string'
            ? post.data.title[0].text
            : post.data.title,
        subtitle:
          typeof post.data.title !== 'string'
            ? post.data.subtitle[0].text
            : post.data.subtitle,
        author:
          typeof post.data.title !== 'string'
            ? post.data.author[0].text
            : post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 30,
  };
};

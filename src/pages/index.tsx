import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ReactElement, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { prismic } from '../services/prismic';

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
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
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
          title: post.data.title[0].text,
          subtitle: post.data.subtitle[0].text,
          author: post.data.author[0].text,
        },
        first_publication_date: new Date(
          post.first_publication_date
        ).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
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
        title: post.data.title[0].text,
        subtitle: post.data.subtitle[0].text,
        author: post.data.author[0].text,
      },
      first_publication_date: new Date(
        post.first_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};

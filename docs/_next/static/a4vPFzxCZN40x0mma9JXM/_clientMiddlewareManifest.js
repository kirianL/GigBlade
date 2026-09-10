self.__MIDDLEWARE_MATCHERS = [
  {
    "missing": [
      {
        "type": "header",
        "key": "next-router-prefetch"
      }
    ],
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/|api(?:\\/|$)|favicon.ico|.*\\..*).*))(\\.json)?[\\/#\\?]?$",
    "originalSource": "/((?!_next/|api(?:/|$)|favicon.ico|.*\\..*).*)"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/llms\\.txt(\\.json)?[\\/#\\?]?$",
    "originalSource": "/llms.txt"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/llms-full\\.txt(\\.json)?[\\/#\\?]?$",
    "originalSource": "/llms-full.txt"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/alog\\.md(\\.json)?[\\/#\\?]?$",
    "originalSource": "/alog.md"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/alog(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?\\.md(\\.json)?[\\/#\\?]?$",
    "originalSource": "/alog/:path*.md"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/blog\\.md(\\.json)?[\\/#\\?]?$",
    "originalSource": "/blog.md"
  },
  {
    "regexp": "^\\/GigBlade(?:\\/(_next\\/data\\/[^/]{1,}))?\\/blog(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?\\.md(\\.json)?[\\/#\\?]?$",
    "originalSource": "/blog/:path*.md"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()
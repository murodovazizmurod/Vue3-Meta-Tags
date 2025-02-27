import type { RouteLocationNormalized, Router } from "vue-router";
import type { App } from "vue";

export const RTL_LOCALES = [
  "ar",
  "arc",
  "dv",
  "fa",
  "ha",
  "he",
  "khw",
  "ks",
  "ku",
  "ps",
  "ur",
  "yi",
];

const preconnect = [] as string[];

let defaultName = "Web App";

let defaultLocale = "en_US";

let locales: string[] = [];

let textCallback = null as ((text: string) => string) | null;

// Taken from https://www.digitalocean.com/community/tutorials/vuejs-vue-router-modify-head
export const setMetaAttributes = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => {
  if (typeof to.meta.description === "string") {
    setDescription(setText(to.meta.description));
  }

  if (typeof to.meta.image === "string") {
    updateOrCreateMetaTag("og:image", to.meta.image);
  }

  updateOrCreateMetaTag("og:site_name", defaultName);

  if (typeof to.meta.locale === "string") {
    setLocale(to.meta.locale ?? defaultLocale);
  } else {
    setLocale(defaultLocale);
  }

  setFollow(true);
  setCurrentUrl();
  updateOrCreateSchema();
  setPreconnect(preconnect);
  setLocaleAlternate(locales);

  // This goes through the matched routes from last to first, finding the closest route with a title.
  // e.g., if we have `/some/deep/nested/route` and `/some`, `/deep`, and `/nested` have titles,
  // `/nested`'s will be chosen.
  const nearestWithTitle = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.title);

  // Find the nearest route element with meta tags.
  const nearestWithMeta = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags);

  const previousNearestWithMeta = from.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags);

  // If a route with a title was found, set the document (page) title to that value.
  if (nearestWithTitle && typeof nearestWithTitle.meta.title === "string") {
    setTitle(setText(nearestWithTitle.meta.title));
  } else if (
    previousNearestWithMeta &&
    typeof previousNearestWithMeta.meta.title === "string"
  ) {
    setTitle(setText(previousNearestWithMeta.meta.title));
  } else if (typeof to.name === "string") {
    setTitle(
      setText(to.name) + " - " + defaultName ??
        defaultName
    );
  } else {
    setTitle(defaultName);
  }

  // Remove any stale meta tags from the document using the key attribute we set below.
  Array.from(document.querySelectorAll("[data-vue-router-controlled]")).map(
    (el) => el.parentNode?.removeChild(el)
  );

  // Skip rendering meta tags if there are none.
  if (!nearestWithMeta || !(nearestWithMeta.meta.metaTags instanceof Array))
    return;

  // Turn the meta tag definitions into actual elements in the head.
  nearestWithMeta.meta.metaTags
    .map((tagDef: { [x: string]: string }) => {
      const tag = document.createElement("meta");

      Object.keys(tagDef).forEach((key) => {
        tag.setAttribute(key, tagDef[key]);
      });

      // We use this to track which meta tags we create so we don't interfere with other ones.
      tag.setAttribute("data-vue-router-controlled", "");

      return tag;
    })
    // Add the meta tags to the document head.
    .forEach((tag: HTMLMetaElement) => document.head.appendChild(tag));
};

export const setLocaleToUse = (locale: string) => {
  defaultLocale = locale;
};

export const setTitle = (title: string) => {
  document.title = title;
  updateOrCreateMetaTag("og:title", title);
  updateOrCreateMetaTag("twitter:title", title);
};

export const setFollow = (follow = true) => {
  updateOrCreateMetaTag("robots", follow ? "index,follow" : "noindex,nofollow");
  updateOrCreateMetaTag(
    "googlebot",
    follow ? "index,follow" : "noindex,nofollow"
  );
};

export const setDescription = (description: string) => {
  updateOrCreateMetaTag("description", description);
  updateOrCreateMetaTag("og:description", description);
  updateOrCreateMetaTag("twitter:description", description);
};

export const setCurrentUrl = (url = null as null | string) => {
  // If the URL is null, set it to the current URL.
  if (url === null) {
    url = window.location.href;
  }
  updateOrCreateMetaTag("og:url", url);
  updateOrCreateMetaTag("twitter:url", url);
};

export const updateOrCreateMetaTag = (
  tagName: string,
  content: string,
  type = "meta",
  tagNameSelector = "property",
  contentSelector = "content",
  additionalAttributes = [] as { name: string; value: string }[]
) => {
  const metaTag = document.querySelector(
    `${type}[${tagNameSelector}="${tagName}"][${contentSelector}]`
  );
  if (metaTag) {
    metaTag.setAttribute(contentSelector, content);
    additionalAttributes.forEach((attribute) => {
      metaTag.setAttribute(attribute.name, attribute.value);
    });
  } else {
    const newMetaTag = document.createElement(type);
    newMetaTag.setAttribute(tagNameSelector, tagName);
    newMetaTag.setAttribute(contentSelector, content);
    additionalAttributes.forEach((attribute) => {
      newMetaTag.setAttribute(attribute.name, attribute.value);
    });
    document.head.appendChild(newMetaTag);
  }
};

export const setDefaultSchema = () => {
  updateOrCreateSchema({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: defaultName,
    applicationCategory: "BrowserApplication",
    offers: {
      "@type": "Offer",
      price: "0",
    },
  });
};

export const updateOrCreateSchema = (json = null as null | Object) => {
  if (!json) {
    return setDefaultSchema();
  }
  const schema = document.querySelector("script[type='application/ld+json']");
  if (schema) {
    schema.innerHTML = JSON.stringify(json);
  } else {
    const newSchema = document.createElement("script");
    newSchema.setAttribute("type", "application/ld+json");
    newSchema.innerHTML = JSON.stringify(json);
    document.head.appendChild(newSchema);
  }
};

export const setLocale = (locale: string) => {
  updateOrCreateMetaTag("og:locale", locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
};

export const setLocaleAlternate = (locales: string[]) => {
  updateOrCreateMetaTag("x-default", "alternate", "link", "hreflang", "rel", [
    {
      name: "href",
      value: window.location.href,
    },
  ]);

  locales.forEach((locale) => {
    updateOrCreateMetaTag(locale, "alternate", "link", "hreflang", "rel", [
      {
        name: "href",
        value: window.location.href,
      },
    ]);
  });
};

export const setPreconnect = (urls: string[]) => {
  urls.forEach((url) => {
    const preconnectLink = document.querySelector(
      `link[rel="preconnect"][href="${url}"]`
    );
    if (!preconnectLink) {
      const newPreconnect = document.createElement("link");
      newPreconnect.setAttribute("rel", "preconnect");
      newPreconnect.setAttribute("href", url);
      document.head.appendChild(newPreconnect);
    }
  });
};

export const setText = (text: string) => {
  if (!textCallback) {
    return text;
  } else {
    return textCallback(text);
  }
};

export const setupMetaTagsHandler = (router: Router) => {
  router.afterEach((to, from, failure) => {
    if (!failure && !to.meta.skipMetaTagsHandler) {
      setMetaAttributes(to, from);
    }
  });
};

export const metaTagPlugin = {
  install: (app: App, options: any, router: Router) => {
    if (options.preconnect) {
      preconnect.push(...options.preconnect);
    }
    if (options.defaultLocale) {
      setLocaleToUse(options.defaultLocale);
    }
    if (options.textCallback) {
      textCallback = options.textCallback;
    }
    if (options.locales) {
      locales = options.locales;
    }
    if (options.defaultName) {
        defaultName = options.defaultName;
    }
    setupMetaTagsHandler(router);
  },
};

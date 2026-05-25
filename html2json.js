function convertHtml2JsonAndSet() {
  const htmlTextAreaValue = document.getElementById("html").value;
  const jsonObj = html2json(htmlTextAreaValue);
  const jsonArea = document.getElementById("json");
  jsonArea.textContent = JSON.stringify(jsonObj, null, 2);
}

/* 
  Update this function to convert html into json object.
  You can rewrite it completely, just be sure it accepts htmlText as string and outputs json object.
*/

function html2json(html) {
  if (typeof html !== "string") {
    return {
      type: "root",
      children: [],
    };
  }

  const root = {
    type: "root",
    children: [],
  };

  const stack = [root];

  const VOID_ELEMENTS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  let i = 0;

  while (i < html.length) {
    try {
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 4);

        const commentContent =
          end === -1 ? html.slice(i + 4) : html.slice(i + 4, end);

        stack[stack.length - 1].children.push({
          type: "comment",
          content: commentContent,
        });

        i = end === -1 ? html.length : end + 3;
        continue;
      }

      if (html[i] === "<") {
        const closeIndex = findTagEnd(html, i + 1);

        if (closeIndex === -1) {
          appendText(stack, html.slice(i));
          break;
        }

        const rawTag = html.slice(i + 1, closeIndex).trim();

        if (!rawTag) {
          i = closeIndex + 1;
          continue;
        }

        if (rawTag[0] === "/") {
          const closingTag = rawTag.slice(1).trim().toLowerCase();

          let foundIndex = -1;

          for (let s = stack.length - 1; s >= 0; s--) {
            if (stack[s].tag === closingTag) {
              foundIndex = s;
              break;
            }
          }

          if (foundIndex !== -1) {
            while (stack.length - 1 >= foundIndex) {
              stack.pop();
            }
          }

          i = closeIndex + 1;
          continue;
        }
        const selfClosing =
          rawTag.endsWith("/") || VOID_ELEMENTS.has(getTagName(rawTag));

        const parsed = parseOpeningTag(rawTag);

        const node = {
          type: "element",
          tag: parsed.tag,
          attributes: parsed.attributes,
          children: [],
        };

        stack[stack.length - 1].children.push(node);

        if (!selfClosing) {
          stack.push(node);
        }

        i = closeIndex + 1;
        continue;
      }

      let nextTag = html.indexOf("<", i);

      if (nextTag === -1) {
        nextTag = html.length;
      }

      const text = html.slice(i, nextTag);

      appendText(stack, text);

      i = nextTag;
    } catch (error) {
      i += 1;
    }
  }
  return root;
}

function findTagEnd(str, start) {
  let quote = null;

  for (let i = start; i < str.length; i++) {
    const char = str[i];

    if ((char === '"' || char === "'") && str[i - 1] !== "\\") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
    }

    if (char === ">" && !quote) {
      return i;
    }
  }

  return -1;
}

function getTagName(rawTag) {
  return rawTag.replace(/\/$/, "").trim().split(/\s+/)[0].toLowerCase();
}

function parseOpeningTag(rawTag) {
  const cleaned = rawTag.replace(/\/$/, "").trim();

  const firstSpace = cleaned.search(/\s/);

  let tag = cleaned;
  let attrString = "";

  if (firstSpace !== -1) {
    tag = cleaned.slice(0, firstSpace);
    attrString = cleaned.slice(firstSpace).trim();
  }

  const attributes = parseAttributes(attrString);

  return {
    tag: tag.toLowerCase(),
    attributes,
  };
}

function parseAttributes(attrString) {
  const attributes = {};

  if (!attrString) {
    return attributes;
  }

  const regex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

  let match;

  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1];

    const value = match[2] ?? match[3] ?? match[4] ?? true;

    attributes[key] = value;
  }

  return attributes;
}

function appendText(stack, text) {
  if (!text || !text.trim()) {
    return;
  }

  stack[stack.length - 1].children.push({
    type: "text",
    content: text,
  });
}

//////////////////////////////////////////////
let files = [];
let currentIndex = 0;

document.getElementById("fileInput").addEventListener("change", (e) => {
  files = Array.from(e.target.files);
  currentIndex = 0;
  loadFile();
});

function loadFile() {
  if (!files.length) return;

  const file = files[currentIndex];
  const reader = new FileReader();

  reader.onload = function (e) {
    document.getElementById("html").value = e.target.result;
  };

  reader.readAsText(file);
}

function prevFile() {
  if (currentIndex > 0) {
    currentIndex--;
    loadFile();
  }
}

function nextFile() {
  if (currentIndex < files.length - 1) {
    currentIndex++;
    loadFile();
  }
}

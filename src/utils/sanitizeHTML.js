export function sanitizeHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  // Remove script tags
  const scripts = template.content.querySelectorAll('script');
  scripts.forEach((s) => s.remove());

  // Remove event handler attributes
  const elements = template.content.querySelectorAll('*');
  elements.forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

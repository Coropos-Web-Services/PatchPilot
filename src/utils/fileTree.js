import { normalizePath, joinPath, pathSeparator } from './browserPath.js';

export function buildFileTree(files) {
  const tree = {
    name: 'Project',
    type: 'directory',
    children: {},
    files: [],
    path: ''
  };

  files.forEach(file => {
    if (file.path && (file.path.includes('/') || file.path.includes('\\'))) {
      const normalized = normalizePath(file.path);
      const pathParts = normalized.split(pathSeparator);
      const fileName = pathParts.pop();
      let currentLevel = tree;
      let currentPath = '';

      pathParts.forEach(dirName => {
        currentPath = currentPath ? joinPath(currentPath, dirName) : dirName;

        if (!currentLevel.children[dirName]) {
          currentLevel.children[dirName] = {
            name: dirName,
            type: 'directory',
            children: {},
            files: [],
            path: currentPath
          };
        }
        currentLevel = currentLevel.children[dirName];
      });

      currentLevel.files.push({
        ...file,
        displayName: fileName,
        parentPath: currentPath
      });
    } else {
      tree.files.push({
        ...file,
        displayName: file.name,
        parentPath: ''
      });
    }
  });

  return tree;
}

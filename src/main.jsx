import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('Script loaded!');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

const root = document.getElementById('root');
console.log('Root element:', root);

if (root) {
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(React.createElement('div', {
    style: { background: 'red', color: 'white', padding: '20px', fontSize: '24px' }
  }, 'HELLO FROM REACT!'));
} else {
  console.error('No root element found!');
}

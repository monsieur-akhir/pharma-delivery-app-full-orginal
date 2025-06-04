// Script utilitaire pour afficher toutes les routes enregistrées dans une application Express
function extractExpressRoutes(app) {
  if (!app || !app._router || !app._router.stack) {
    console.log('Impossible de trouver les routes Express');
    return [];
  }

  const routes = [];
  
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach((stackItem) => {
        routes.push({
          method: stackItem.method.toUpperCase(),
          path: path + (layer.route ? layer.route.path : '')
        });
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (layer.regexp ? layer.regexp.toString() : '')));
    } else if (layer.method) {
      routes.push({
        method: layer.method.toUpperCase(),
        path: path + (layer.route ? layer.route.path : '')
      });
    }
  }
  
  // Logging all layers for debugging
  console.log('All Express routes:');
  app._router.stack.forEach((layer, i) => {
    console.log(`[Layer ${i}] Name: ${layer.name}, Path: ${layer.regexp}, Route: ${layer.route ? JSON.stringify(layer.route.path) : 'none'}`);
    
    if (layer.name === 'router') {
      print('', layer);
    }
  });
  
  return routes;
}

module.exports = { extractExpressRoutes };
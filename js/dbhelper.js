/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    //http://localhost:${port}
    return 'http://localhost:1337/restaurants';
  }

  static openDb() {
    let dbPromise = idb.open('food_locator-db', 2, (upgradeDb) => {
      upgradeDb.createObjectStore('restaurants',  {autoIncrement: true});
      if (!upgradeDb.objectStoreNames.contains('reviews')) {
        let reviews = upgradeDb.createObjectStore('reviews', {
          keyPath: 'id'
        });

        reviews.createIndex('id', 'id');
      }
    });

    return dbPromise;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then((response) => {
      return response.json();
    }).then((restaurants) => {
      // Save the JSON response to DB
      DBHelper.save(restaurants);
      callback(null, restaurants);
    }).catch(error => console.log(error));

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    let mobileImage = `img/mobile_${restaurant.id}.jpg`;
    let mediumImage = `img/${restaurant.id}.jpg`;

    return {
      smallImgSrc: mobileImage,
      mediumImgSrc: mediumImage
    }
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /**
  * Register Service Worker
  */
  static registerServiceWorker() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.register('serviceWorker.js')
      .then(() => {
        console.log("Service Worker successfully installed");
    });
  }

  static save(restaurants) {
    DBHelper.openDb().then((db) => {
      if (!db) return;

      let tx = db.transaction('restaurants', 'readwrite');
      let store = tx.objectStore('restaurants');

      for (let restaurant of restaurants) {
        store.put(restaurant);
      }
      // limit store to 10 items
      store.openCursor(null, "prev").then(cursor => {
        return cursor.advance(10);
      }).then(function deleteRest(cursor) {
        if (!cursor) return;
        cursor.delete();
        return cursor.continue().then(deleteRest);
      });
    });
  }

  static getLastReviewId() {
    const id = getParameterByName('id');
    let lastId = 0;
    return new Promise((resolve, reject) => {
      DBHelper.getAllReviews().then((reviews) => {
        let filteredReviews = reviews.filter(review => review.restaurant_id == id);
        lastId = filteredReviews.length;
        resolve(parseInt(parseInt(lastId) + 1));
      });
    });
  }

  static getAllReviews() {
    return new Promise((resolve, reject) => {
      DBHelper.openDb().then((db) => {
          if (!db) return;
  
          let tx = db.transaction('reviews')
            .objectStore('reviews')
            tx.getAll().then(reviews => {
            resolve(reviews);
          });
        });
      }
    );
  }

  static saveComment(data) {
    DBHelper.openDb().then((db) => {
      if (!db) return;

      let tx = db.transaction('reviews', 'readwrite');
      let store = tx.objectStore('reviews');

      let request = store.put(data);

      request.onsuccess = function(e) {
        // Execute the callback function.
        console.log(e);
      };
      // Handle errors.
      console.log(request.onerror);
    });
  }

static postReviewToServer(data) {
  data.sent = true;
  const url = 'http://localhost:1337/reviews/';
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify(data),
    }).then(response => response.json())
  }
}

DBHelper.registerServiceWorker();


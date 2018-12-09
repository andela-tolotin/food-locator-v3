let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  let mapbox_token = 'pk.eyJ1IjoibGF6dG9wYXoiLCJhIjoiY2prbDJ5YmphMXF3NTNrb2c3MWVwd3J3cyJ9.A5kR6w5IyetjxUCi1huHdg';
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token='+mapbox_token, {
        mapboxToken: '${mapbox_token}',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }

  const route = window.location.pathname;
  const id = getParameterByName('id');

  if (!id && route !== '/') { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.title = restaurant.name;;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = restaurant.name;
  image.title = restaurant.name;
 
  let {smallImgSrc, mediumImgSrc} = DBHelper.imageUrlForRestaurant(restaurant);

  image.src = smallImgSrc;
  image.srcset = `${smallImgSrc} 380w, ${mediumImgSrc} 650w`;
  image.sizes = `(min-width: 650px) 50vw, 10vw`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = DBHelper.getAllReviews()) => {
  reviews.then((reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    title.title = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      noReviews.title = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');

    const id = getParameterByName('id');

    let filteredReviews = reviews.filter(review => review.restaurant_id == id);

    filteredReviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = convertTimestampToDate(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

let data = {};
let url =  window.location.pathname + `?id=${getParameterByName('id')}`;

createReviewForm = (review) => {
  const formId = document.getElementById('comment_form');

  const heading = document.createElement('h2'); // Heading of Form
  const headerText = 'You got a comment?';
  heading.innerHTML = headerText;
  heading.title = headerText;
  formId.appendChild(heading);

  var line = document.createElement('hr'); // Giving Horizontal Row After Heading
  formId.appendChild(line);

  var linebreak = document.createElement('br');
  formId.appendChild(linebreak);

  // Create the commentor's name
  const CommentorName = document.createElement('input');
  CommentorName.id = 'name';
  CommentorName.name = 'name';
  CommentorName.type ='text';
  CommentorName.setAttribute('value', '');
  CommentorName.required = 'required';
  CommentorName.onchange = function() {
    data.name = this.value;
  }

  const nameLabel = document.createElement('label');
  nameLabel.innerHTML = 'Name:';
  nameLabel.setAttribute('for', 'name');
  formId.appendChild(nameLabel);
  formId.appendChild(CommentorName);

  var linebreak = document.createElement('br');
  formId.appendChild(linebreak);

  // Create the rating slider
  const rating = document.createElement('input');
    rating.id = 'rating';
    rating.type = 'range';
    rating.min = 1;
    rating.max = 5;
    rating.setAttribute('value', 1);
    rating.step = 1;
    rating.required = 'required';
    rating.onchange = function() {
      data.rating = this.value;
    }
  
  const ratingLabel = document.createElement('label');
  ratingLabel.innerHTML = 'Rating:';
  ratingLabel.setAttribute('for', 'rating');
  formId.appendChild(ratingLabel);
  formId.appendChild(rating);

  var linebreak = document.createElement('br');
  formId.appendChild(linebreak);
  var linebreak = document.createElement('br');
  formId.appendChild(linebreak);
  // Comment text area
  const comment = document.createElement('textarea');
  comment.name = 'comment';
  comment.id = 'comment';
  comment.setAttribute('value', '');
  comment.required = 'required';
  comment.onchange = function() {
    data.comments = this.value;
  }
  
  const commentLabel = document.createElement('label');
  commentLabel.innerHTML ='Comment:';
  commentLabel.setAttribute('for', 'comment');
  formId.appendChild(commentLabel);
  formId.appendChild(comment);

  var linebreak = document.createElement('br');
  formId.appendChild(linebreak);

  // Submit form button
  const submitelement = document.createElement('input'); // Append Submit Button
  submitelement.type = 'submit';
  submitelement.name = 'submit';
  submitelement.id = 'submit';
  submitelement.value = 'Submit';
  submitelement.onclick = function() {
    submitReview();
  }

  formId.appendChild(submitelement);
}

const submitReview = () => {
  const id = getParameterByName('id');
  let timestamp = Math.floor(Date.now());
  data.createdAt = timestamp;
  data.updatedAt = timestamp;
  
  data.restaurant_id = id;

  DBHelper.getLastReviewId().then((lastId) => {
    data.id = lastId;
  });

  if (data.rating === undefined && data.comments === undefined) {
    return alert('Pls add your review');
  }

  // Post Reviews
  DBHelper.postReviewToServer(data).then((review) => {
    window.location.href = url;
  }).catch((err) => {
    data.sent = false;
    // Alert the user that they are not online
    alert('You appears to be offline, you comment has been saved and will sent when you\'re online');
    // Save the review
    DBHelper.saveComment(data);
    window.location.href = url;
    console.log(err);
  });
}

const fetchOnlineReviews = () => {
  const id = getParameterByName('id');
  const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
  return fetch(url).then(response => response.json())
}

const saveOnlineReviews = () => {
  fetchOnlineReviews().then((reviews) => {
    reviews.forEach(review => {
     // Save review
     review.sent = true;
     DBHelper.saveComment(review);
    });
  });
}

const convertTimestampToDate = (timestamp) => {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let  date = new Date(timestamp);
  // Year
  let year = date.getFullYear();
  // Month
  let month = months[date.getMonth()];
  // Day
  let day = date.getDate();

  return `${day} of ${month} , ${year}`;
}

// Save Online Review
saveOnlineReviews();
// Create Review comment form
createReviewForm();

// Check if there's network and send the review
window.addEventListener('message', function (event) {
  const id = getParameterByName('id');
   DBHelper.getAllReviews().then((reviews) => {
    let filteredReviews = reviews.filter(review => review.restaurant_id == id && false == review.sent);

    if (filteredReviews.length > 0) {
      filteredReviews.forEach((review) => {
        // Post Reviews
        DBHelper.postReviewToServer(review).then((response) => {
          return review;
        }).then((review) => {
          DBHelper.openDb().then((db) => {
            if (!db) return;
            let tx = db.transaction('reviews', 'readwrite');
            let store = tx.objectStore('reviews');
            if (review.sent) return;
            store.delete(review.id);
            return tx.complete
          }).then(() => {
            console.log('Item deleted')
          });
        }).catch((err) => {
          console.log(err);
        });
      });
    }
  });
});



// GENERAL IMPORT
require('./bootstrap');
require('chart.js/dist/Chart.min.js');
import WOW from 'wowjs';
import Typed from 'typed.js';
import { map } from 'jquery';
new WOW.WOW().init();
//------//
$(document).ready( function() {

  $('.overlay-cover-show').click(function() {

    $('.all-view-show').css('opacity','1').css('pointer-events','visible');
    $('.all-view-show').removeClass('animate__fadeOutUp').addClass('animate__animated animate__fadeInUp');

  });

  $('.delete-carousel').click(function() {

    $('.all-view-show').removeClass('animate__fadeInUp').addClass('animate__fadeOutUp');

  });

  const ipServer = 'localhost';

  reviewsLoad();
    if (window.location.pathname == '/'|| window.location.pathname == '/host/firstapartment/create') {
        // ALGOLIA INDEX
        var typed = new Typed('#smart-write', {
            strings: ["Benvenuto in ^500 BoolBNB!", "Cerca l'appartamento dei tuoi sogni!"],
            typeSpeed: 70,
            smartBackspace: true,
            backSpeed: 70,
            showCursor: false
          });          
        var placesAutocomplete = places({
            appId: 'pl19ZMXZ5X0L',
            apiKey: '035a9540a189547cb9889a73bf507a48',
            container: document.querySelector('#address-input')
        });
        placesAutocomplete.on('change', function(e) {
            $('#cordinates').val([e.suggestion.latlng.lat,e.suggestion.latlng.lng]);
        });
    }
    if (window.location.pathname == '/search') {
      var placesAutocomplete = places({
          appId: 'pl19ZMXZ5X0L',
          apiKey: '035a9540a189547cb9889a73bf507a48',
          container: document.querySelector('#address-input')
      });
      // MARKER APPARTAMENTI MAPPA
      var apartments = $('.card_apartment_search');
      var arrayApartments = [];
      for (let i = 0; i < apartments.length; i++) {
        arrayApartments.push({lat : apartments[i].dataset.lat,lng : apartments[i].dataset.lng,id : apartments[i].dataset.id,cover : apartments[i].dataset.img,title : apartments[i].dataset.title,description : apartments[i].dataset.description,address : apartments[i].dataset.address,beds : apartments[i].dataset.beds,rooms : apartments[i].dataset.rooms,bathrooms : apartments[i].dataset.bathrooms});
      }
      var markers = [];
      var startMap = mapShow($('#map_container').data('lat'),$('#map_container').data('lng'),arrayApartments);
      //----------------//
      placesAutocomplete.on('change', function(e) {
        $('#cordinates').val([e.suggestion.latlng.lat,e.suggestion.latlng.lng]);
        callApiApartmentSearch();
      });
      $('input').on('change',function() {
        callApiApartmentSearch();
      });
      // API CALL
      function callApiApartmentSearch() {
        var services = [];
        $("input[name='services']:checked").each(function() {
          services.push($(this).val());
        });
        $.ajax({
          method: 'GET',
          url: 'http://' + ipServer + ':8000/api/search',
          data: {
            'stanze' : $('input[name=stanze]').val(), 
            'services' : services,
            'postiletto' : $('input[name=postiletto]').val(),
            'range' : $('input[name=range]').val(),
            'address' : $('input[name=address]').val(),
            'cordinates' : $('input[name=cordinates]').val(),
          },
          success: function(data) {
            $('.bs-example').empty();
            if (data.apartments.total == 0) {
              $('.apartment_searched').html("<h3 class='text-center wow animate__animated animate__pulse'>oops..<i class='far fa-grin-beam-sweat'></i> sembra che non ci siano appartamenti!</h3>");
              return;
            }
            refreshApartments(data);
          }
        });
      }
      function refreshApartments(data) {
        var source = $('#template').html();
        var template = Handlebars.compile(source);
        var apartments = data.apartments.data;
        var rangeView = data.range;
        mapRefresh(data.lat,data.lng,apartments,rangeView);
        apartments.forEach(apartment => {
          var context = {
            latitude: apartment.latitude,
            longitude: apartment.longitude,
            title: apartment.title,
            description: apartment.description.substr(0,100) + '..',
            cover: apartment.imgurl,
            id: apartment.id,
            rooms: apartment.n_rooms,
            beds: apartment.n_beds,
            bathrooms: apartment.n_bathrooms,
            servizi: apartment.servizi
          };
          var html = template(context);
          $('.bs-example').append(html);
        });
      }
      function mapRefresh(lat,lng,apartments,rangeView) {
        startMap.invalidateSize();
        startMap.setView([lat,lng],15);
        markers.forEach(marker => {
          removeMarker(marker);
        });
        markers = [];
        apartments.forEach(apartment => {
          addMarker(apartment);
        });
        var featureGroup = L.featureGroup(markers);
        startMap.fitBounds(featureGroup.getBounds().pad(0.5), {animate: false});
      }
      function addMarker(apartment) {
        var marker = L.marker([apartment.latitude,apartment.longitude]).addTo(startMap);
        marker.bindPopup(`
              <a id="card_popup" href="http://` + ipServer + `:8000/apartments/show/` + apartment.id + `">
                <div class="card-img-top" style="background-image: url('` + apartment.imgurl + `'); height: 200px; background-size: cover;"></div>
                <div class="card-body">
                <h5 class="card-title">` + apartment.title + `</h5>
                <p class="card-text">` + apartment.description.substr(0,100) + `</p>
                <p class="card text p-2">` + apartment.address + `</p>
                <div class="card-footer d-flex justify-content-between align-items -center">
                  <div class="d-flex justify-content-center align-items">
                    <i class="fas fa-bed"> ` + apartment.n_beds + ` </i>
                  </div>
                  <div class="d-flex justify-content-center align-items">
                    <i class="fas fa-door-closed"> ` + apartment.n_rooms + ` </i>
                  </div>
                  <div class="d-flex justify-content-center align-items">
                    <i class="fas fa-toilet"> ` + apartment.n_bathrooms + ` </i>
                  </div>
                </div>
              </div>
            </a>  
            `)
        markers.push(marker);
      }
      function removeMarker(marker) {
        startMap.removeLayer(marker);
      }
    }
    // MAPPA SHOW
    mapShow($('.card_show').data('lat'),$('.card_show').data('lng'));
    function mapShow(lat,lng,apartments) { 
        var map = L.map("map_container").setView([lat,lng], 13);
        var osmLayer = new L.TileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              minZoom: 5,
              maxZoom: 20,
              attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            }
        );
        map.addLayer(osmLayer);
        if (window.location.pathname != '/search') {
          L.marker([lat, lng]).addTo(map); 
        }
        if (apartments) {
          for (var i = 0; i < apartments.length; i++) {
            var marker = L.marker([apartments[i].lat,apartments[i].lng]).addTo(map);
            
              marker.bindPopup(`
              <a id="card_popup" href="http://` + ipServer + `:8000/apartments/show/` + apartments[i].id + `">
                        <div class="card-img-top" style="background-image: url('` + apartments[i].cover + `'); height: 200px; background-size: cover;"></div>
                        <div class="card-body">
                        <h5 class="card-title">` + apartments[i].title + `</h5>
                        <p class="card-text">` + apartments[i].description.substr(0,100)+ `</p>
                        <p class="card text p-2">` + apartments[i].address + `</p>
                        <div class="card-footer d-flex justify-content-between align-items -center">
                          <div class="d-flex justify-content-center align-items">
                            <i class="fas fa-bed"> ` + apartments[i].beds + ` </i>
                          </div>
                          <div class="d-flex justify-content-center align-items">
                            <i class="fas fa-door-closed"> ` + apartments[i].rooms + ` </i>
                          </div>
                          <div class="d-flex justify-content-center align-items">
                            <i class="fas fa-toilet"> ` + apartments[i].bathrooms + ` </i>
                          </div>
                        </div>
                      </div>
                    </div>
              </a>      
              `);
            markers.push(marker);
          }
        }
        return map;
    }
    function reviewsLoad() {
      $.ajax({
        method: 'GET',
        url: 'http://' + ipServer + ':8000/api/reviews',
        data: {
          'id' : $('input[name=apartment_id]').val() 
        },
        success: function(data) {
          $('.reviews_container').empty();
          var source = $('#template_reviews').html();
          var template = Handlebars.compile(source);
          var reviews = data.reviews;
          for (let i = 0; i < reviews.length; i++) {
            var context = {
              name: reviews[i].name,
              message: reviews[i].message,
              created_at: reviews[i].created_at,
              vote: reviews[i].vote
            };
            var html = template(context);
            $('.reviews_container').append(html);
          }  
        }
      });
    }
    $(document).on('click','.reviews_send', function() {
        var user_name = $('input[name=user_name_reviews]').val();
        ajaxReview(user_name);
        reviewsLoad();  
    });
    function ajaxReview(user_name) {
      $.ajax({
        method: 'POST',
        url: 'http://' + ipServer + ':8000/api/reviews',
        data: {
          'id_apartment' : $('input#id_apartment_review').val(),
          'message' : $('#message_review').val(),
          'vote' : $('input#vote_review').val(),
          'user' : user_name,
        }
      });
    }
});
// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var cacheName = 'demo-pwa-1';
var filesToCaches = [];
var validDomains = ["fonts.gstatic.com"];

function checkValidCacheDomain(url){
  var url = url.replace("https://","").replace("http://","");
  if(url.indexOf(self.location.hostname) == 0)
      return true;
  for (var i in validDomains){
    var domain = validDomains[i];
    if (url.indexOf(domain) == 0){
      return true;
    }
  }
  return false;
}

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCaches);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

function getFetch(request){
  return fetch(request).then(function(response) {
    var isValidDomain = checkValidCacheDomain(request.url);
    if(isValidDomain){
      console.log('get from internet', request);
      caches.open(cacheName).then(function (cache) {
        cache.put(request, response);
      });
    }
    return response.clone();
  });
}

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if(response) {
        console.log('get from cache', e.request);
        return response;
      }
      else{
        return getFetch(e.request);
      }
    }).catch(function(){
      getFetch(e.request);
    })
  );
});

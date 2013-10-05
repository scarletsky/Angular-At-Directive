Angular-At-Directive
====================

## Requirements

+ AngularJS
+ Jquery

## Usage

+ Include `caret.js` and `at.js` in your `index.html`

        <script src="http://code.jquery.com/jquery-1.10.1.min.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min.js"></script>
        <script src="app/scripts/caret.js"></script>
        <script src="app/scripts/at.js"></script>
        <script src="app/scripts/app.js"></script>

+ Add 'At' to your module's list of dependencies

        angular.module('myApp', ['At'])

+ Add `at-user` and `auto-complete` to textarea

        <textarea ng-model="message.content"
              ng-trim="false"
              rows="5"
              cols="100"  
              flag="@"
              at-user
              auto-complete></textarea>

+ Add your own at-list template after <Textara> tag

        <span ng-show="!isAtListHidden" auto-follow="true">
            <ul class="list-at-user">
                <li ng-repeat="user in users | filter: query.text | limitTo: 5"
                    ng-click="autoComplete(user)">
                    <img ng-src="{{ user.image }}" class="avatar pull-left" width="50" height="50">
                    <span>{{ user.username }}</span>
                </li>
            </ul>
        </span>

+ **Note :** your at-list template should have `ng-show="!isAtListHidden"` attribute.

## ToDo

+ Add contenteditable Demo
+ Refacor `AtUtils` service
+ Support emoji
+ Add unit test

##SP Thanks
[@ichord](https://github.com/ichord) And his [At.js](https://github.com/ichord/At.js)


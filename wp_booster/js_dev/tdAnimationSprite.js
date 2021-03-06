/**
 * Created by tagdiv on 29.09.2015.
 */

/* global jQuery:{} */

var tdAnimationSprite = {};

(function(){
    'use strict';

    tdAnimationSprite = {

        items: [],

        // flag used to not call requestAnimationFrame until the previous requestAnimationFrame callback runs
        isInRequestAnimation: false,


        // The item that needs animation
        item: function item() {



            // here we store the block Unique ID. This enables us to delete the item via this id @see tdPullDown.deleteItem
            this.blockUid = '';

            // boolean - an item must be initialized only once
            this._isInitialized = false;

            // boolean - an item can be paused and restarted
            this.paused = false;

            // boolean - the animation automatically starts at the computing item
            this.automatStart = true;

            // object - css properties that will be changed (key - value; ex: 'color' : '#00FFCC')
            this.properties = [];

            // boolean - flag used by the requestAnimationFrame callback to know which items have properties to apply
            this.readyToAnimate = false;

            // the index of the current frame
            this.nextFrame = 1;

            // number - the current interval id set for the animation
            this.interval = undefined;

            // the jquery obj whose background will be animated
            this.jqueryObj = undefined;

            // the css class selector of the jqueryObj
            this.animationSpriteClass = undefined;

            // string - default direction for parsing the sprite img
            this._currentDirection = 'right';

            // number - the executed loops
            this._executedLoops = 0;


            // string - css background position
            this._prop_background_position = undefined;


            // The followings will be set from the class selector

            // int - number of frames (it must be greater than 1 to allow animation)
            this.frames = undefined;

            // the width(px) of a frame
            this.frameWidth = undefined;

            // int - the interval time (ms) the animation runs
            this.velocity = undefined;

            // boolean - to the right and vice versa
            this.reverse = undefined;

            // number - number of loops to animate
            this.loops = undefined;


            // Function actually compute the params for animation, prepare the params for next animation and calls t
            // he requestAnimationFrame with a callback function to animate all items ready for animation
            this.animate = function() {

                this._prop_background_position = ( -1 * this.nextFrame * this.frameWidth ) + 'px 0';
                this.readyToAnimate = true;


                // The nextFrame value is computed for next frame
                if ( true === this.reverse) {

                    if ( 'right' === this._currentDirection ) {

                        if ( this.nextFrame === this.frames - 1 ) {
                            this._currentDirection = 'left';
                            this.nextFrame--;
                        } else {
                            this.nextFrame++;
                        }

                    } else if ( 'left' === this._currentDirection ) {
                        if ( 0 === this.nextFrame ) {

                            this._currentDirection = 'right';
                            this.nextFrame++;
                            this._executedLoops++;

                            if ( ( 0 !== this.loops ) && ( this._executedLoops === this.loops ) ) {
                                clearInterval( this.interval );
                            }
                        } else {
                            this.nextFrame--;
                        }
                    }

                } else {

                    if ( this.nextFrame === this.frames - 1 ) {

                        this._executedLoops++;

                        // complete tour ( once to the right ), so we stop
                        if ( ( 0 !== this.loops ) && ( this._executedLoops === this.loops ) ) {
                            clearInterval( this.interval );
                        }

                        this.nextFrame = 0;
                    } else {
                        this.nextFrame++;
                    }
                }


                //this.jqueryObj.css('background-position', horizontalPosition + 'px 0');

                // Any calls to requestAnimationFrame are stopped. Anyway, the settings of the current item are ready,
                // so the callback will consider it.
                if ( false === tdAnimationSprite.isInRequestAnimation ) {
                    tdAnimationSprite.isInRequestAnimation = true;
                    window.requestAnimationFrame( tdAnimationSprite.animateAllItems );
                }
            };
        },

        /**
         * The css class selector must be some like this 'td_animation_sprite-10-50-500-0-1-1'
         * It must start with 'td_animation_sprite'
         * Fields order:
         * - number of frames
         * - width of a frame
         * - velocity in ms
         * - loops (number) : reload the animation cycle at infinity or specify the number of loops
         * - reverse (0 or 1) : the loop include, or not, the reverse path
         * - automatstart (0 or 1) : the item animation starts, or not, automatically
         *
         * @param item
         * @private
         */
        _initializeItem: function( item ) {
            if ( ( true === item._isInitialized ) ) {
                return;
            }

            // get all strings containing 'td_animation_sprite'
            var regex = /(td_animation_sprite\S*)/gi;

            // resultMatch is an array of matches, or null if there's no matching
            var resultMatch = item.jqueryObj.attr( 'class' ).match( regex );

            if ( null !== resultMatch ) {

                item.offsetTop = item.jqueryObj.offset().top;
                item.offsetBottomToTop = item.offsetTop + item.jqueryObj.height();

                // the last matching is considered, because new css classes that matches, can be added before recomputing an item
                item.animationSpriteClass = resultMatch[ resultMatch.length - 1 ];

                var sceneParams = item.animationSpriteClass.split( '-' );

                if ( 7 === sceneParams.length ) {

                    item.frames = parseInt( sceneParams[1] );
                    item.frameWidth = parseInt( sceneParams[2] );
                    item.velocity = parseInt( sceneParams[3] );
                    item.loops = parseInt( sceneParams[4] );

                    if ( 1 === parseInt( sceneParams[5] ) ) {
                        item.reverse = true;
                    } else {
                        item.reverse = false;
                    }

                    if ( 1 === parseInt( sceneParams[6] ) ) {
                        item.automatStart = true;
                    } else {
                        item.automatStart = false;
                    }

                    item._isInitialized = true;
                }
            }
        },



        addItem: function( item ) {

            if ( item.constructor === tdAnimationSprite.item ) {
                tdAnimationSprite.items.push( item );
                tdAnimationSprite._initializeItem( item );

                if ( true === item.automatStart ) {
                    tdAnimationSprite.computeItem( item );
                }
            }
        },


        /**
         * Deletes an item base on blockUid.
         * Make sure that you add blockUid to items that you expect to be deleted
         * @param blockUid
         */
        deleteItem: function(blockUid) {
            for (var cnt = 0; cnt < tdAnimationSprite.items.length; cnt++) {
                if (tdAnimationSprite.items[cnt].blockUid === blockUid) {
                    tdAnimationSprite.items.splice(cnt, 1); // remove the item from the "array"
                    return true;
                }
            }
            return false;
        },

        computeItem: function( item ) {

            // set interval just for frames greater than 1
            if ( item.frames > 1 ) {

                // Check the item interval to not be set
                if ( undefined !== item.interval ) {
                    return;
                }

                item.interval = setInterval(function(){

                    if ( false === item.paused ) {
                        item.animate();
                    }

                }, item.velocity );
            }
        },

        // At recomputing, an item will check again its last css class selector and it is reinitialized. So, if a new
        // css class selector is added, it will use it. This way the animation can be modified
        recomputeItem: function( item ) {

            // stop any animation
            clearInterval( item.interval );

            // reset the item interval
            item.interval = undefined;

            // reset the _isInitialized flag
            item._isInitialized = false;

            // reinitialize item
            tdAnimationSprite._initializeItem( item );

            // compute the item again
            tdAnimationSprite.computeItem( item );
        },

        // Clear the interval set for an item.
        stopItem: function( item ) {
            if ( ( item.constructor === tdAnimationSprite.item ) && ( true === item._isInitialized ) ) {
                clearInterval( item.interval );

                // reset the item interval
                item.interval = undefined;
            }
        },

        // Start animation of a paused item
        startItem: function( item ) {
            if ( ( item.constructor === tdAnimationSprite.item ) && ( true === item._isInitialized ) ) {
                item.paused = false;
            }
        },

        // Pause animation of an item
        pauseItem: function( item ) {
            if ( ( item.constructor === tdAnimationSprite.item ) && ( true === item._isInitialized ) ) {
                item.paused = true;
            }
        },




        computeAllItems: function() {
            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                tdAnimationSprite.computeItem( tdAnimationSprite.items[i] );
            }
        },

        recomputeAllItems: function() {
            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                tdAnimationSprite.recomputeItem( tdAnimationSprite.items[i] );
            }
        },

        stopAllItems: function() {
            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                tdAnimationSprite.stopItem( tdAnimationSprite.items[i] );
            }
        },

        pauseAllItems: function() {
            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                tdAnimationSprite.pauseItem( tdAnimationSprite.items[i] );
            }
        },

        startAllItems: function() {
            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                tdAnimationSprite.startItem( tdAnimationSprite.items[i] );
            }
        },


        // The requestAnimationFrame callback function.
        // The 'background-position' is set and then the 'readyToAnimate' flag is set to false
        animateAllItems: function() {
            var currentItem;

            for ( var i = 0; i < tdAnimationSprite.items.length; i++ ) {
                currentItem = tdAnimationSprite.items[i];
                if ( true === currentItem.readyToAnimate ) {
                    currentItem.jqueryObj.css( 'background-position', currentItem._prop_background_position );
                    currentItem.readyToAnimate = false;
                }
            }
            tdAnimationSprite.isInRequestAnimation = false;
        }
    };

    /*
     <div class="td_animation_sprite-a-b-c-d-e-f"></div>

    @note - we should have used the data- html attribute here!

     a - number of frames
     b - width(px) of a frame
     c - velocity
     d - loops number (0 for infinity)
     e - loop include reverse
     f - animation start automatically
     */

    var tdAnimationSpriteElements = jQuery( 'span[class^="td_animation_sprite"]' );

    for ( var i = 0; i < tdAnimationSpriteElements.length; i++ ) {
        var tdAnimationSpriteItem = new tdAnimationSprite.item();


        tdAnimationSpriteItem.jqueryObj = jQuery( tdAnimationSpriteElements[i] );
        tdAnimationSpriteItem.blockUid = tdAnimationSpriteItem.jqueryObj.data('td-block-uid');   // the block uid is used on the front end editor when we want to delete this item via it's blockuid
        tdAnimationSprite.addItem( tdAnimationSpriteItem );
    }
})();

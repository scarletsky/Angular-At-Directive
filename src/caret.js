angular.module('ngCaret', [])
  .factory('EditableCaret', function (
    CaretUtils
  ) {
    'use strict';

    return {
      range: function () {
        var sel;

        if (!window.getSelection) {
          return;
        }
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
          return sel.getRangeAt(0);
        } else {
          return null;
        }
      },

      getPos: function (element) {
        var clonedRange, pos, range;
        range = this.range();
        if (range) {
          clonedRange = range.cloneRange();
          clonedRange.selectNodeContents(element[0]);
          clonedRange.setEnd(range.endContainer, range.endOffset);
          pos = clonedRange.toString().length;
          clonedRange.detach();
          return pos;
        } else if (document.selection) {
          return this.getOldIEPos(element);
        }
      },

      getOldIEPos: function (element) {
        var preCaretTextRange, textRange;

        textRange = document.selection.createRange();
        preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(element[0]);
        preCaretTextRange.setEndPoint('EndToEnd', textRange);
        return preCaretTextRange.text.length;
      },

      setPos: function (element) {
        return element[0];
      },

      getOffset: function (element) {
        var clonedRange, offset, range, rect;

        offset = null;
        range = this.range();
        if (window.getSelection && range) {
          clonedRange = range.cloneRange();
          clonedRange.setStart(range.endContainer, Math.max(1, range.endOffset) - 1);
          clonedRange.setEnd(range.endContainer, range.endOffset);
          rect = clonedRange.getBoundingClientRect();
          offset = {
            height: rect.height,
            left: rect.left + rect.width,
            top: rect.top
          };
          clonedRange.detach();
        } else if (document.selection) {
          this.getOldIEOffset();
        }
        return CaretUtils.adjustOffset(offset, element);
      },

      getOldIEOffset: function () {
        var range, rect;

        range = document.selection.createRange().duplicate();
        range.moveStart('character', -1);
        rect = range.getBoundingClientRect();
        return {
          height: rect.bottom - rect.top,
          left: rect.left,
          top: rect.top
        };
      }
    };
  })

  .factory('InputCaret', function (
    Mirror,
    CaretUtils
  ) {
    'use strict';

    return {
      getPos: function (element) {
        if (document.selection) {
          return this.getIEPos(element);
        } else {
          return element[0].selectionStart;
        }
      },

      getIEPos: function (element) {
        var endRange, inputor, len, normalizedValue, pos, range, textInputRange;

        inputor = element[0];
        range = document.selection.createRange();
        pos = 0;
        if (range && range.parentElement() === inputor) {
          normalizedValue = inputor.value.replace(/\r\n/g, '\n');
          len = normalizedValue.length;
          textInputRange = inputor.createTextRange();
          textInputRange.moveToBookmark(range.getBookmark());
          endRange = inputor.createTextRange();
          endRange.collapse(false);
          if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
            pos = len;
          } else {
            pos = -textInputRange.moveStart('character', -len);
          }
        }
        return pos;
      },

      setPos: function (element, pos) {
        var inputor, range;

        inputor = element[0];
        if (document.selection) {
          range = inputor.createTextRange();
          range.move('character', pos);
          range.select();
        } else if (inputor.setSelectionRange) {
          inputor.setSelectionRange(pos, pos);
        }
        return inputor;
      },

      getPosition: function (element, pos) {
        var inputor, atRect, format, h, html, startRange, x, y;

        inputor = element;
        format = function (value) {
          return value.replace(/</g, '&lt').replace(/>/g, '&gt').replace(/`/g, '&#96').replace(/'/g, '&quot').replace(/\r\n|\r|\n/g, '<br />');
        };
        if (angular.isUndefined(pos)) {
          pos = this.getPos(inputor);
        }
        startRange = inputor.val().slice(0, pos);
        html = '<span>' + format(startRange) + '</span>';
        html += '<span id="caret">|</span>';
        atRect = Mirror.create(inputor, html).rect();
        x = atRect.left - inputor[0].scrollLeft;
        y = atRect.top - inputor[0].scrollTop;
        h = atRect.height;
        return {
          left: x,
          top: y,
          height: h
        };
      },

      getOffset: function (element, pos) {
        var inputor, offset, position;

        inputor = element;
        if (document.selection) {
          return CaretUtils.adjustOffset(this.getIEOffset(inputor, pos), inputor);
        } else {
          offset = inputor.offset();
          position = this.getPosition(element, pos);
          offset = {
            left: offset.left + position.left,
            top: offset.top + position.top,
            height: position.height
          };
          return offset;
        }
      },

      getIEOffset: function (element, pos) {
        var h, range, textRange, x, y;

        textRange = element[0].createTextRange();
        if (pos) {
          textRange.move('character', pos);
        } else {
          range = document.selection.createRange();
          textRange.moveToBookmark(range.getBookmark());
        }
        x = textRange.boundingLeft;
        y = textRange.boundingTop;
        h = textRange.boundingHeight;
        return {
          left: x,
          top: y,
          height: h
        };
      }
    };
  })

  .factory('Mirror', function () {
    'use strict';

    var cssAttr = [
      'overflowY',
      'height',
      'width',
      'paddingTop',
      'paddingLeft',
      'paddingRight',
      'paddingBottom',
      'marginTop',
      'marginLeft',
      'marginRight',
      'marginBottom',
      'fontFamily',
      'borderStyle',
      'borderWidth',
      'wordWrap',
      'fontSize',
      'lineHeight',
      'overflowX',
      'text-align'
    ];

    return {
      mirrorCss: function (element) {
        var css = {
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: -20000,
          'white-space': 'pre-wrap'
        };
        angular.forEach(cssAttr, function(value) {
          css[value] = element.css(value);
        });
        return css;
      },

      create: function (element, html) {
        this.mirror = angular.element('<div></div>');
        this.mirror.css(this.mirrorCss(element));
        this.mirror.html(html);
        element.after(this.mirror);
        return this;
      },

      rect: function () {
        var flag, pos, rect;

        flag = this.mirror.find('#caret');
        pos = flag.position();
        rect = {
          left: pos.left,
          top: pos.top,
          height: flag.height()
        };
        this.mirror.remove();
        return rect;
      }
    };
  })
    
  .factory('CaretUtils', function () {
    'use strict';

    return {
      adjustOffset: function(offset, inputor) {
        if (!offset) {
          return;
        }
        offset.top += window.scrollY + inputor[0].scrollTop;
        offset.left += +window.scrollX + inputor[0].scrollLeft;
        return offset;
      },
      contentEditable: function(inputor) {
        return !!(inputor[0].contentEditable && inputor[0].contentEditable === 'true');
      }
    };
  })

  .factory('Caret', function (
    InputCaret,
    EditableCaret
    ) {
    'use strict';
    return {
      getPos: function (element) {
        if (element.attr('contenteditable') === 'true') {
          return EditableCaret.getPos(element);
        } else {
          return InputCaret.getPos(element);
        }
      },

      setPos: function (element, pos) {
        if (element.attr('contenteditable') === 'true') {
          return EditableCaret.setPos(element, pos);
        } else {
          return InputCaret.setPos(element, pos);
        }
      },

      getOffset: function (element) {
        if (element.attr('contenteditable') === 'true') {
          return EditableCaret.getOffset(element);
        } else {
          return InputCaret.getOffset(element);
        }
      }
    };
  });

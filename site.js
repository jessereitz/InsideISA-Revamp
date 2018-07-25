var PopoutEditor = {
  /*  PopoutEditor allows quick editing of more complex elements.

    This is used for parts of the InsideISA email which require more input than
    simple text (eg. images, links, etc.).

    Attributes:
      $editor (HTML Element): The HTML Element containing the editor.
      $form (HTML Element): The HTML form contained within $editor.
      fields (Array of PopoutEditorField): The fields to be displayed as part
        of the PopoutEditor.
  */
  init: function() {
    // initializes the PopoutEditor by finding the editor on DOM.
    this.$editor = document.getElementById("popoutEditor");
    this.$form = this.$editor.getElementsByTagName('form')[0];
    this.fields = [];
    this.handler;
  },
  setup: function(fields, saveHandler) {
    // sets up the PopoutEditor for use.
    // fields is Array of PopoutEditorField
    // saveHandler is Function to be called when the save button is pressed.
    if (fields) {
      this.fields = fields;
    } else {
      this.fields = [];
    }
    if (saveHandler) {
      this.handler = saveHandler;
    } else {
      this.handler = undefined;
    }
  },
  display: function($where) {
    // $where (HTML element; req)
    // Takes an HTML element to use for display positioning. Displays the
    // PopoutEditor at the top right of the given element.
    this.$editor.style.top = $where.offsetTop;
    this.$editor.style.left = $where.offsetLeft + $where.offsetWidth + 25;
    this.$editor.classList.remove('hide');
  },
  hide: function() {
    this.$editor.classList.add('hide');
  }
}

PopoutEditor.init();

var PopoutEditable = {
  fields: [],
  renderFields: function() {
    var html = '';
    for (let field of this.fields) {
      // console.log(field.render());
      // html += field.render();
    }
    return html;
  }
}

var PopoutEditorField = {
  init: function(fieldName) {
    this.div = document.createElement('div');
    this.div.setAttribute('contenteditable', 'true');
    this.div.classList.add('editable');
    this.div.id = fieldName
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertLabel: function($where) {
    $where.append(this.label);
  },
  insertDiv: function($where) {
    $where.append(this.div);
  }
}

var blank = Object.create(PopoutEditable);
var field = Object.create(PopoutEditorField);
// console.log(field.render());

blank.fields.push(Object.create(PopoutEditorField));

blank.fields.push(Object.create(PopoutEditorField));

blank.fields.push(Object.create(PopoutEditorField));

blank.fields.push(Object.create(PopoutEditorField));

var imgEdit = document.getElementById('imgEdit0');
var linkEdit = document.getElementById('linkEdit0');
var editor = PopoutEditor;

const PLACEHOLDER_IMG = './images/placeholder.gif';
const PLACEHOLDER_BLURB = "This is the blurb";

/////////////////////////////
/////     UTILITIES     /////
/////////////////////////////
function generateElement(tagName, klasses, id) {
  if (!tagName) {
    return False;
  }
  var el = document.createElement(tagName);
  el.id = id;
  for (let klass of klasses) {
    el.classList.add(klass);
  }

    return el;
}


/////////////////////////////////
/////     Popout Editor     /////
/////////////////////////////////
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

var PopoutEditorField = {
  init: function(fieldName) {
    this.div = Object.create(InlineEditable);
    this.div.generateField('div', [], fieldName);
    this.div.id = fieldName
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertLabel: function($where) {
    $where.append(this.label);
  },
  insertDiv: function($where) {
    this.div.insertHTML($where);
  }
}



var PopoutEditable = {
  // PopoutEditables are elements which have multiple fields of information
  // which must be supplied. These elements use the PopoutEditor to supply all
  // the pertinent information.
  init: function(tagName, placeholder, id) {
    this.el = generateElement(tagName, id);
    if (tagName === 'img') {
      this.el.src = placeholder;
    } else {
      this.el.textContent = placeholder;
    }
  },
  fields: [],
  insertFields: function($where) {
    // iterates through fields and renders them on the given HTML element ($where)
    for (let field of fields) {
      field.insertLabel($where);
      field.insertDiv($where);
    }
  },
  addField: function(fieldName) {
    // Creates and pushes a new PopoutEditorField to this.fields.
    var field = Object.create(PopoutEditorField);
    field.init(fieldName);
    this.fields.push(field);
  },
  insertHTML: function($where) {
    $where.append(this.el);
  }
}

var InlineEditable = {
  // InlineEditables are elements which can be editable in-place. They are
  // essentially elements with contenteditable set to true.
  generateField: function(tagName, klasses, id) {
    // Creates an InlineEditable element with appropriate classes and attrs.
    if (!klasses) {
      klasses = [];
    }
    klasses.push('editable');
    this.el = generateElement(tagName, klasses, id);
    this.el.setAttribute('contenteditable', true);
  },
  insertHTML: function($where) {
    $where.append(this.el);
  },
  value: function() {
    return this.el.textContent;
  }
}

var blank = Object.create(PopoutEditable);
var field = Object.create(PopoutEditorField);


ContentSection = {
  id: 0, // id number, given as argument to init.
  fields: {
    // contentType: 'blah', // InlineEditable
    // contentTitle: 'Blah', // InlineEditable
    // contentImage: Object.create(PopoutEditable),
    // contentBlurb: 'paragraph', // InlineEditable
    // contentLink: Object.create(PopoutEditable)
  },

  init: function(id) {
    // generates each field in fields as a placeholder.
    /*
      Arguments:
        id (Int): the integer to be used as this section's id.
    */
    id = Number(id);
    if (isNaN(id)) {
      return False;
    }
    this.id = id;
    this.idString = 'section' + String(this.id) + '_';
    this.addInlineField('contentType', 'h2');
    this.addInlineField('contentTitle', 'h1');
    this.addPopoutField('contentImage', 'img', PLACEHOLDER_IMG, ['URL', 'Title', 'Alt Text']);
    this.addInlineField('contentBlurb', 'div');
    this.addPopoutField('contentLink', 'div', PLACEHOLDER_BLURB, ['URL', 'Text']);
  },
  addInlineField: function(fieldName, tagName) {
    this[fieldName] = Object.create(InlineEditable);
    this[fieldName].generateField(tagName, [], this.idString + fieldName);
  },
  addPopoutField: function(fieldName, tagName, placeholder, popoutFields) {
    this[fieldName] = Object.create(PopoutEditable);
    this[fieldName].init(tagName, placeholder, this.idString + fieldName);
    for (let field of popoutFields) {
      this[fieldName].addField(field);
    }
  },
  render: function($where) {
    var ctn = document.createElement('div');
    this.contentType.insertHTML(ctn);
    this.contentTitle.insertHTML(ctn);
    this.contentImage.insertHTML(ctn);
    this.contentBlurb.insertHTML(ctn);
    this.contentLink.insertHTML(ctn);
    $where.append(ctn);
  }

}

EmailGenerator = {
  container: document.getElementById('emailContent'), // The div containing the content to be pasted into GRS
  sections: {
    introduction: 'paragraph', // InlineEditable
    contentSections: [ContentSection] // Array of ContentSections
  },
  init: function() {
    // find the email container in the document, generate first content section,
    // get everything good to go.
  },

  copyToClipboard: function() {
    // Copy the content of the email to the clipboard for easy pasting into GRS.
  }
}






var imgEdit = document.getElementById('imgEdit0');
var linkEdit = document.getElementById('linkEdit0');
var editor = PopoutEditor;

(function InitializeInsideISAEmailGenerator() {
  'use strict';

////////////////////////////////////
/////     STYLE CONSTANTS     //////
////////////////////////////////////
/*
  These constants are used for the inline-style on various pieces of the HTML
  email.
*/
const TABLE_CTN_STYLE = "font-family: Helvetica Neue, Helvetica, Arial, sans-serif;color: #333333; font-size:16px;";
const TD_CTN_STYLE = "border-bottom: 3px solid #ddd; position: relative;";
const CONTENT_HEADING_CTN_STYLE = "margin: 20px; width: 80%;";
const CONTENT_TYPE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 16px; margin: 0; color: #888;";
const CONTENT_TITLE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 24px; margin: 0; margin-top: 5px; color: #333;";
const CONTENT_IMG_STYLE = "max-width: 100%;  text-align: center; margin-left: auto; margin-right: auto;";
const CONTENT_BLURB_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;padding: 20px;";
const CONTENT_LINK_CTN_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;;padding-left: 20px; padding-bottom: 20px; color: blue;";
const CONTENT_LINK_STYLE = "color: inherit; text-decoration: none;";
const COPY_TEXTAREA_STYLE = "position: fixed; top: 0; left: 0; width: 2em; height: 2em; border: none; outline: none; padding: 0; boxShadow: none; background: transparent;";

//////////////////////////////////////
/////     TEXT PLACEHOLDERS     //////
//////////////////////////////////////
/*
  These are the default values for sections of the HTML email.
*/
const PLACEHOLDER_INTRO = "Enter your introduction here!";
const PLACEHOLDER_TYPE = "Content Type";
const PLACEHOLDER_TITLE = "Content Title";
const PLACEHOLDER_IMG = './images/placeholder.gif';
const PLACEHOLDER_BLURB = "This is the blurb";
const PLACEHOLDER_LINK = "Learn More";

//////////////////////////
/////     FIELDS     /////
//////////////////////////
/*
  These are the PopoutEditor fields for the image and link sections of the HTML
  email.
*/
const CONTENT_IMG_FIELDS = ['URL', 'Title', 'Alt Text'];
const CONTENT_LINK_FIELDS = ['URL', 'Text'];


/////////////////////////////
/////     UTILITIES     /////
/////////////////////////////
function generateElement(tagName, klasses, id) {
  /* Provides a simple function to create an element with classes and an id.*/
  if (!tagName) {
    return false;
  }
  var el = document.createElement(tagName);
  if (id) {
    el.setAttribute('id', id);
  }
  if (klasses) {
    for (let klass of klasses) {
      el.classList.add(klass);
    }
  }
    return el;
}


/////////////////////////////////
/////     Popout Editor     /////
/////////////////////////////////
var PopoutEditor = {
  /*  PopoutEditor allows quick editing of more complex elements (img, a, etc).

    This is used for the image and link sections of the InsideISA email, which
    require more input from the user in order to properly be displayed.

    Attributes:
      $editor (HTML Element): The HTML Element containing the editor.
      $form (HTML Element): The HTML form contained within $editor.
      fields (Array of PopoutEditorField): The fields to be displayed as part
        of the PopoutEditor.
      $saveBtn (HTML Element): The save (submit) button for $form.
      $cancelBtn (HTML Element): A button in $form that dismisses the
        PopoutEditor without saving the user's changes.
      fields (Array of PopoutEditorField): An Array of the fields that currently
        compose the PopoutEditor.
      saveHandler (function): The function to be called when the #saveBtn is
        clicked.
  */
  init: function() {
    /* Initialize the PopoutEditor

    This method initializes the PopoutEditor by finding its respective elements,
    ensures that its html elements are hidden, and attaching the appropriate
    event listeners to $form, $cancelBtn, and the document object.

    */
    this.$editor = document.getElementById("popoutEditor");
    this.$form = this.$editor.getElementsByTagName('form')[0];
    this.$saveBtn = this.$form.querySelector('#popoutSave');
    this.$cancelBtn = this.$form.querySelector('#popoutCancel');
    this.fields = [];
    this.hide();
    this.$form.addEventListener('submit', this.defaultHideHandler.bind(this));
    this.$cancelBtn.addEventListener('click', this.defaultHideHandler.bind(this));
    document.addEventListener('click', this.defaultOffClickHandler.bind(this));
  },
  setup: function(editable, saveHandler) {
    /* Sets up the PopoutEditor for use.

    This method differs from the init method in that it adds the appropriate
    fields and saveHandler to the PopoutEditor. The init method merely ensure
    the PopoutEditor exists and that it has the proper properties for use; setup
    actually gets it ready for use by the user.

    setup does five things:
      1. Iterate through and remove current fields, if applicable
      2. Resets current editable, if applicable. This ensures current editable
          no longer displays as active.
      3. Assigns PopoutEditor's editable to that passed. Makes this.fields point
          to new editable's fields.
      4. Renders fields into $form.
      5. Assigns the given saveHandler to be called on $form submit.
    */
    for (let field of this.fields) {
      if (this.$form.contains(field.label)) {
        this.$form.removeChild(field.label);
      }
      if (this.$form.contains(field.div.el)) {
        this.$form.removeChild(field.div.el);
      }
    }
    if (this.editable) {
      this.editable.clickOffHandler();
    }
    if (editable) {
      this.editable = editable;
      if (this.editable.fields) {
        this.fields = this.editable.fields;
      } else {
        this.fields = [];
      }

    }
    for (let field of this.fields) {
      this.$form.insertBefore(field.insertLabel(), this.$saveBtn);
      this.$form.insertBefore(field.insertDiv(), this.$saveBtn);
    }
    if (saveHandler) {
      this.saveHandler = saveHandler;
      this.$form.addEventListener('submit', this.saveHandler);
    } else {
      this.handler = undefined;
    }
  },
  display: function(xPos, yPos) {
    /* Display the PopoutEditor at the given x-position (xPos) and y-position (yPos) */
    this.$editor.style.top = yPos;
    this.$editor.style.left = xPos;
    this.$editor.classList.remove('hide');
    this.hidden = false;
  },
  hide: function() {
    /* Hide the PopoutEditor and remove the active state from the editable. */
    this.$editor.classList.add('hide');
    this.hidden = true;
    if (this.editable) {
      this.editable.clickOffHandler();
    }
    this.$saveBtn.removeEventListener('submit', this.saveHandler);
    for (let field of this.fields) {
      this.$form.removeChild(field.label);
      this.$form.removeChild(field.div.el);
    }
  },
  defaultHideHandler: function(e) {
    /* This method provides default functionality for hiding the PopoutEditor. */
    e.preventDefault();
    this.hide();
  },
  defaultOffClickHandler: function(e) {
    /* Auto-hide PopoutEditor if user clicks off.

    This is the default method for auto-hiding the PopoutEditor if a user
    clicks off the editor. If the user clicks on any element other than the
    current editable or the PopoutEditor, the PopoutEditor will be hidden and
    all changes will be lost.
   */
    if (!this.hidden && (!this.$editor.contains(e.target) && !this.editable.wasClicked(e))) {
      this.hide();
    }
  }
};


var InlineEditable = {
  /* InlineEditables are elements which can be editable in-place.

  One of two types of editables, InlineEdtiables can simply be clicked on and
  edited in place. They do not require the use of the PopoutEditor in order to
  be edited. In practice, they are essentially just divs with contenteditable
  set to true.

  Attributes:
    el (HTML element): The HTML element which will be displayed.
  */
  generateField: function(tagName, klasses, id, placeholder, style) {
    /* Generates the InlineEditable field.

    Arguments:
      tagName (String): the type of element to be used (typically div)
      klasses (Array of String): an Array of Strings to be added to el as
        classes.
      id (String): the id to be added to el
      placeholder (String): the text to be placed in the element by default.
      style (String): any inline style to be added to el. This is useful
        because this is an HTML email editor.
     */
    if (!klasses) {
      klasses = [];
    }
    klasses.push('editable');
    this.el = generateElement(tagName, klasses, id);
    this.el.setAttribute('contenteditable', true);
    if (placeholder) {
      this.el.textContent = placeholder;
    }
    if (style) {
      this.el.setAttribute('style', style);
    }
  },
  insertOrReturnHTML: function($where, $node) {
    /* Append the HTML for el to $where or simply return the HTML for el. */
    var node;
    if ($node && $node instanceof Element) {
      node = $node;
    } else {
      node = this.el;
    }
    if ($where && $where instanceof Element) {
      $where.append(node);
    } else {
      return node;
    }
  },
  renderEditable: function($where) {
    /* Renders the InlineEditable in an editable format. */
    this.el.classList.add('editable');
    this.el.setAttribute('contenteditable', true);
    return this.insertOrReturnHTML($where);
  },
  renderFinal: function($where) {
    /* Renders the InlineEditable in the final, non-editable format. */
    var dupNode = this.el.cloneNode(true);
    dupNode.classList.remove('editable');
    dupNode.removeAttribute('contenteditable');
    return this.insertOrReturnHTML($where, dupNode);
  },
  value: function() {
    /* Returns the value of the editable, similar to a form field. */
    return this.el.textContent;
  }
};

var PopoutEditorField = {
  init: function(fieldName) {
    this.div = Object.create(InlineEditable);
    this.div.generateField('div', [], fieldName);
    this.div.id = fieldName;
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertLabel: function($where) {
    if ($where && $where instanceof Element) {
        $where.append(this.label);
    } else {
      return this.label;
    }

  },
  insertDiv: function($where) {
    return this.div.renderEditable($where);
  },
  getValue: function() {
    return this.div.value();
  }
};



var PopoutEditable = {
  // PopoutEditables are elements which have multiple fields of information
  // which must be supplied. These elements use the PopoutEditor to supply all
  // the pertinent information.
  init: function(tagName, placeholder, id, style, ctnKlass, outerCtn) {
    this.el = generateElement(tagName, [], id);
    this.el.setAttribute('style', style);
    if (tagName === 'img') {
      this.el.src = placeholder;
    } else {
      this.el.textContent = placeholder;
    }
    this.fields = [];

    this.editCtn = generateElement('a', [ctnKlass, 'popoutEdit']);
    this.editCtn.href = '#';
    var text = generateElement('div');
    text.textContent = 'edit';
    text.classList.add(ctnKlass + '__text');
    this.editCtn.append(text);
    this.outerCtn = outerCtn;

    this.editCtn.addEventListener('click', this.clickHandler.bind(this));
  },
  fields: [],
  addField: function(fieldName) {
    // Creates and pushes a new PopoutEditorField to this.fields.
    var field = Object.create(PopoutEditorField);
    field.init(fieldName);
    this.fields.push(field);
  },
  addFields: function(fields) {
    for (let fieldName of fields) {
      var field = Object.create(PopoutEditorField);
      field.init(fieldName);
      this.fields.push(field);
    }
  },
  renderEditable: function($where, ctnKlass) {
    var ctnKlasses = ['popoutEdit'];
    if (ctnKlass) {
      ctnKlasses.push(ctnKlass);
    }
    var el;
    if (this.ctn) {
      this.ctn.append(this.el);
      el = this.ctn;
    } else {
      el = this.el;
    }
    this.editCtn.append(el);

    if ($where && $where instanceof Element) {
      $where.append(this.editCtn);
    } else {
      return this.editCtn;
    }
  },
  renderFinal: function($where) {
    var el = this.el.cloneNode(true);
    if (this.ctn) {
      var ctn = this.ctn.cloneNode();
      ctn.append(el);
      el = ctn;
    }
    if ($where && $where instanceof Element) {
      $where.append(el);
    } else {
      return el;
    }
  },
  clickHandler: function(e) {
    e.preventDefault();
    this.editCtn.classList.add('popoutEdit--focus');
    var right = this.outerCtn.getBoundingClientRect();
    right = right.right + 25;
    var top = this.el.getBoundingClientRect();
    top = top.top + window.scrollY;
    // debugger;
    PopoutEditor.setup(this, this.saveHandler);
    PopoutEditor.display(right, top);
  },
  setSaveHandler: function(func) {
    this.saveHandler = func.bind(this);
  },
  clickOffHandler: function() {
    this.editCtn.classList.remove('popoutEdit--focus');
  },
  getValue: function(fieldName) {
    var field = this.fields.find(function (el) {
      return el.div.id === fieldName;
    });
    return field.getValue();
  },
  wasClicked: function(e) {
    var clicked = this.editCtn.contains(e.target);
    return clicked;
  }
};

var ContentSection = {
  init: function(id, parentGenerator) {
    // generates each field in fields as a placeholder.
    /*
      Arguments:
        id (Int): the integer to be used as this section's id.
    */
    id = Number(id);
    if (isNaN(id)) {
      return false;
    }
    this.id = id;
    this.parentGenerator = parentGenerator;
    this.idString = 'section' + String(this.id) + '_';
    this.placeholderStart = "Section " + this.id + " ";
    this.createCtns();
    this.addInlineField('contentType', 'h2', this.placeholderStart + PLACEHOLDER_TYPE, CONTENT_TYPE_STYLE);
    this.addInlineField('contentTitle', 'h1', this.placeholderStart + PLACEHOLDER_TITLE, CONTENT_TITLE_STYLE);
    this.addImageField();
    this.addInlineField('contentBlurb', 'div', this.placeholderStart + PLACEHOLDER_BLURB, CONTENT_BLURB_STYLE);
    this.addLinkField();

  },
  addInlineField: function(fieldName, tagName, placeholder, style) {
    this[fieldName] = Object.create(InlineEditable);
    this[fieldName].generateField(tagName, [], this.idString + fieldName, placeholder, style);
  },
  addPopoutField: function(fieldName, tagName, placeholder, popoutFields, style, ctnKlass) {
    this[fieldName] = Object.create(PopoutEditable);
    this[fieldName].init(tagName, placeholder, this.idString + fieldName, style, ctnKlass, this.ctn);
    this[fieldName].addFields(popoutFields);

  },
  addImageField: function() {
    this.addPopoutField('contentImage', 'img', PLACEHOLDER_IMG, CONTENT_IMG_FIELDS, CONTENT_IMG_STYLE, 'imgEdit');
    this.contentImage.setSaveHandler(function (e) {
      e.preventDefault();
      var url = this.getValue('URL');
      var title = this.getValue('Title');
      var alt = this.getValue('Alt Text');
      if (url) {
        this.el.src = url;
      }
      if (title) {
        this.el.title = title;
      }
      if (alt) {
        this.el.alt = alt;
      }
    });
  },
  addLinkField: function() {
    this.addPopoutField('contentLink', 'a', this.placeholderStart + PLACEHOLDER_LINK, CONTENT_LINK_FIELDS, CONTENT_LINK_STYLE, 'linkEdit');
    var ctn = generateElement('div');
    ctn.setAttribute('style', CONTENT_LINK_CTN_STYLE);
    this.contentLink.ctn = ctn;
    this.contentLink.setSaveHandler(function (e) {
      e.preventDefault();
      var href = this.getValue('URL');
      var text = this.getValue('Text');
      if (href) {
        this.el.href = href;
      }
      if (text) {
        this.el.textContent = text;
      }
    });
  },
  createCtns: function() {
    this.ctn = document.createElement('tr');
    this.innerCtn = document.createElement('td');
    this.innerCtn.setAttribute('style', TD_CTN_STYLE);
    this.headingCtn = document.createElement('div');
    this.headingCtn.setAttribute('style', CONTENT_HEADING_CTN_STYLE);
    this.innerCtn.append(this.headingCtn);
    this.ctn.append(this.innerCtn);

    if (this.id !== 1) {
      this.generateDeleteBtn();
    }
  },
  renderEditable: function($where) {
    this.headingCtn.append(this.contentType.renderEditable());
    this.headingCtn.append(this.contentTitle.renderEditable());
    this.contentImage.renderEditable(this.innerCtn);
    this.contentBlurb.renderEditable(this.innerCtn);
    this.contentLink.renderEditable(this.innerCtn);
    return this.ctn;
  },
  renderFinal: function($where) {
    var ctn = this.ctn.cloneNode();
    var innerCtn = this.innerCtn.cloneNode(false);
    var headingCtn = this.headingCtn.cloneNode(false);
    innerCtn.append(headingCtn);
    headingCtn.append(this.contentType.renderFinal());
    headingCtn.append(this.contentTitle.renderFinal());
    this.contentImage.renderFinal(innerCtn);
    this.contentBlurb.renderFinal(innerCtn);
    this.contentLink.renderFinal(innerCtn);
    ctn.append(innerCtn);
    return ctn;
  },
  generateDeleteBtn: function() {
    this.deleteBtn = generateElement('button', ['contentSection__deleteBtn', 'standardBtn'], this.idString + 'deleteBtn');
    this.deleteBtn.innerHTML = "&#215;";
    this.deleteBtn.setAttribute('title', 'Delete Section');
    this.deleteBtn.addEventListener('click', this.delete.bind(this));
    this.innerCtn.append(this.deleteBtn);
  },
  delete: function() {
    this.ctn.parentNode.removeChild(this.ctn);
    this.parentGenerator.deleteContentSection(this);
  }

};

var EmailGenerator = {
  init: function() {
    // find the email container in the document, generate first content section,
    // get everything good to go.
    this.contentSections = [];
    this.container = document.getElementById('contentSectionsCtn');
    this.contentSectionsCtn = document.getElementById('contentSectionsCtn');
    this.bottomBtns = document.getElementById('bottomBtns');
    this.copyTarget = document.getElementById('copyTarget');
    this.generateIntroduction();
    this.generateSection();
  },
  generateIntroduction: function() {
    this.introduction = Object.create(InlineEditable);
    this.introduction.generateField('p', [], 'introPara', PLACEHOLDER_INTRO);
    this.introduction.renderEditable(document.getElementById('introCtn'));
  },
  generateSection: function() {
    var section = Object.create(ContentSection);
    var sectionId;
    if (this.contentSections.length > 0) {
      sectionId = this.contentSections[this.contentSections.length-1].id + 1;
    } else {
      sectionId = 1;
    }
    section.init(sectionId, this);
    this.contentSections.push(section);
    this.contentSectionsCtn.insertBefore(section.renderEditable(), this.bottomBtns);
  },
  deleteContentSection: function(section) {
    var sectionIndex = this.contentSections.indexOf(section);
    this.contentSections.splice(sectionIndex, 1);
  },
  copyToClipboard: function() {
    // Copy the content of the email to the clipboard for easy pasting into GRS.
    var copyTarget = this.copyTarget.cloneNode(true);
    var contentCtn = copyTarget.querySelector('#copyTarget-contentSectionsCtn');
    var introCtn = copyTarget.querySelector('#copyTarget-introCtn');
    var bottomBtns = copyTarget.querySelector('#copyTarget-bottomBtns');

    introCtn.append(this.introduction.renderFinal());
    for (let contentSection of this.contentSections) {
      var sec = contentSection.renderFinal();
      contentCtn.insertBefore(sec, bottomBtns);
    }
    var copyTextarea = document.createElement('textarea');
    var copyTextStyle = COPY_TEXTAREA_STYLE;
    copyTextarea.setAttribute('style', copyTextStyle);
    copyTextarea.value = copyTarget.outerHTML;
    document.body.append(copyTextarea);
    copyTextarea.focus();
    copyTextarea.select();

    var successful;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('err');
    }
    document.body.removeChild(copyTextarea);
    if (successful) {
      window.alert('successfully copied!');
    }
  },
  generateTableCtn: function() {
    var table = document.createElement('table');
    table.setAttribute('align', 'center');
    table.setAttribute('cellpaddding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    table.setAttribute('width', '600');
    table.setAttribute('style', TABLE_CTN_STYLE);
  },
};

var Controller = {
  init: function() {
    this.copyCodeBtn = document.getElementById('copyCodeBtn');
    this.addSectionBtn = document.getElementById('addSectionBtn');
    this.startOverBtn = document.getElementById('startoverBtn');

    this.copyCodeBtn.addEventListener('click', this.copyCodeHandler.bind(this));
    this.addSectionBtn.addEventListener('click', this.addSectionHandler.bind(this));
    this.startOverBtn.addEventListener('click', this.startOverHandler.bind(this));
  },

  copyCodeHandler: function(e) {
    e.preventDefault();
    EmailGenerator.copyToClipboard();
  },
  addSectionHandler: function(e) {
    e.preventDefault();
    EmailGenerator.generateSection();
  },
  startOverHandler: function(e) {
    e.preventDefault();
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', function(e) {
  EmailGenerator.init();
  PopoutEditor.init();
  Controller.init();
});
})();

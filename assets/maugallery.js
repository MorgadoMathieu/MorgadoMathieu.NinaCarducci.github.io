(function ($) {
  // Définition du plugin jQuery mauGallery
  $.fn.mauGallery = function (options) {
    // Fusionner les options fournies avec les valeurs par défaut
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = [];

    return this.each(function () {
      // Créer le conteneur pour les éléments de la galerie
      $.fn.mauGallery.methods.createRowWrapper($(this));

      // Si l'option lightBox est activée, créer la lightbox
      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox(
          $(this),
          options.lightboxId,
          options.navigation
        );
      }

      // Attacher les écouteurs d'événements
      $.fn.mauGallery.listeners(options);

      // Parcourir chaque élément de la galerie
      $(this)
        .children(".gallery-item")
        .each(function (index) {
          // Rendre l'image responsive si c'est une balise IMG
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          // Déplacer l'élément dans le conteneur de ligne
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this));
          // Envelopper l'élément dans une colonne selon la configuration
          $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);
          // Récupérer et stocker le tag associé à l'élément
          var theTag = $(this).data("gallery-tag");
          if (
            options.showTags &&
            theTag !== undefined &&
            tagsCollection.indexOf(theTag) === -1
          ) {
            tagsCollection.push(theTag);
          }
        });

      // Afficher les tags de filtrage si activé
      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          $(this),
          options.tagsPosition,
          tagsCollection
        );
      }

      // Afficher la galerie avec une transition en fondu
      $(this).fadeIn(500);
    });
  };

  // Options par défaut du plugin
  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  // Définition des écouteurs d'événements pour le plugin
  $.fn.mauGallery.listeners = function (options) {
    // Ouverture de la lightbox au clic sur une image de la galerie
    $(".gallery-item").on("click", function () {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    // Filtrer les images en fonction du tag sélectionné
    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    // Navigation dans la lightbox (précédent)
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );

    // Navigation dans la lightbox (suivant)
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
  };

  // Définition des méthodes du plugin
  $.fn.mauGallery.methods = {
    // Créer un conteneur "row" pour les éléments de la galerie
    createRowWrapper(element) {
      if (
        !element
          .children()
          .first()
          .hasClass("row")
      ) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    // Envelopper un élément dans une colonne, selon le nombre de colonnes souhaité
    wrapItemInColumn(element, columns) {
      if (columns.constructor === Number) {
        // Calcul de la largeur de la colonne en fonction du nombre total de colonnes
        element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        var columnClasses = "";
        // Configuration responsive pour chaque breakpoint
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },

    // Déplacer l'élément dans le conteneur de la ligne
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },

    // Ajouter la classe responsive aux images
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },

    // Ouvrir la lightbox et afficher l'image cliquée
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },

    // Afficher l'image précédente dans la lightbox
    prevImage() {
      let activeImage = null;
      // Identifier l'image actuellement affichée dans la lightbox
      $("img.gallery-item").each(function () {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      // Récupérer le tag actif pour le filtrage
      let activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];
      // Si le tag actif est "all", récupérer toutes les images, sinon filtrer par tag
      if (activeTag === "all") {
        $(".item-column").each(function () {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function () {
          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
        next = null;

      // Trouver l'index de l'image actuellement active dans la collection
      $(imagesCollection).each(function (i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
        }
      });
      // Choisir l'image précédente (ou la dernière image si en début de collection)
      next =
        imagesCollection[index - 1] ||
        imagesCollection[imagesCollection.length - 1];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },




    // Afficher l'image suivante dans la lightbox
    nextImage() {
      let activeImage = null;
      // Identifier l'image actuellement affichée dans la lightbox
      $("img.gallery-item").each(function () {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });

      // Récupérer le tag actif pour le filtrage
      let activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];

      // Si le tag actif est "all", récupérer toutes les images, sinon filtrer par tag
      if (activeTag === "all") {
        $(".item-column").each(function () {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function () {

          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));

          }
        });
      }

      let index = 0,
        next = null;

      // Trouver l'index de l'image actuellement active dans la collection
      $(imagesCollection).each(function (i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
          
        }
      });

      next = imagesCollection[index + 1] || imagesCollection[0];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },

    // Créer la structure HTML de la lightbox
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`<div class="modal fade" id="${lightboxId ? lightboxId : "galleryLightbox"
        }" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            ${navigation
          ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>'
          : '<span style="display:none;" />'
        }
                            <img class="lightboxImage img-fluid" alt="Contenu de l\'image affichée dans la modale au clique"/>
                            ${navigation
          ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">></div>'
          : '<span style="display:none;" />'
        }
                        </div>
                    </div>
                </div>
            </div>`);
    },

    // Afficher la barre de tags pour filtrer les images
    showItemTags(gallery, position, tags) {
      var tagItems = '<li class="nav-item"><span class="nav-link active active-tag"  data-images-toggle="all">Tous</span></li>';
      
      // Ajouter chaque tag unique à la liste
      $.each(tags, function (index, value) {
        tagItems += `<li class="nav-item active"><span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });

      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      // Positionner la barre de tags en haut ou en bas de la galerie
      if (position === "bottom") {
        gallery.append(tagsRow);

      } else if (position === "top") {
        gallery.prepend(tagsRow);

      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },

    // Filtrer les images affichées selon le tag sélectionné
    filterByTag() {
      // Ne rien faire si le tag est déjà actif
      if ($(this).hasClass("active-tag")) {
        return;
      }

      // Mettre à jour la classe active pour le tag sélectionné
      $(".active-tag").removeClass("active active-tag");
      $(this).addClass("active active-tag");

      var tag = $(this).data("images-toggle");

      // Parcourir toutes les images de la galerie et afficher/cacher selon le tag
      $(".gallery-item").each(function () {
        $(this)
          .parents(".item-column")
          .hide();

        if (tag === "all") {
          $(this)
            .parents(".item-column")
            .show(300);
        } else if ($(this).data("gallery-tag") === tag) {
          $(this)
            .parents(".item-column")
            .show(300);
        }
      });
    }
  };
})(jQuery);

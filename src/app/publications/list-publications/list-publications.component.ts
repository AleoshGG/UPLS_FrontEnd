import { Component, OnInit } from '@angular/core';
import { IPublications } from '../../models/i-publications';
import { PublicationService } from '../../service/publications.service';
import { DoneesService } from '../../service/donees.service';
import { IComments } from '../../models/icomments';
@Component({
  selector: 'app-list-publications',
  templateUrl: './list-publications.component.html',
  styleUrl: './list-publications.component.css'
})
export class ListPublicationsComponent implements OnInit {
  publications: IPublications[] = [];
  imagesMap: Map<string, Blob> = new Map();  // Mapa para almacenar los Blobs de las imágenes
  miniProfileView: any[] = [];
  photoUrls: { [id: string]: string } = {};
  comments: IComments[] = [];

  rol_access: string = localStorage.getItem('rolAccess') || 'NoAccess';
  commentContent: string | undefined;
  commentService: any;

  constructor(
    private publicationService: PublicationService,
    private _donees: DoneesService
  ) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  loadPublications(): void {
    this.publicationService.getAllPublications().subscribe({
      next: (data: IPublications[]) => {
        this.publications = data;

        // Iterar por cada publicación y cargar la imagen si el atributo "image" está presente
        this.publications.forEach((publication) => {
          if (publication.image) {
            this.publicationService.showImg(publication.image).subscribe({
              next: (blob) => {
                // Guardar el Blob en el Map utilizando el atributo "image" como clave
                this.imagesMap.set(publication.image, blob);
              },
              error: (error) =>
                console.error(`Error al cargar la imagen para la publicación ${publication.image}:`, error),
            });
          }

          // Llamar a searchUserData para cargar mini perfil de cada publicación
          this.searchUserData(publication);
        });
      },
      error: (error) => console.error('Error al cargar publicaciones:', error),
    });
  }

  searchUserData(publication: IPublications): void {
    if (this.rol_access == 'donee' && publication.id_donee) {
      this._donees.getDoneeNT(publication.id_donee).subscribe({
        next: (response) => {
          this.loadViewMiniProfile(response, publication._id || '' );
        },
        error: (err) => {
          console.log('Error loading donee data:', err);
        },
      });
    }
  }

  loadViewMiniProfile(profile: any, id_publication: string) {
    const miniProfileView = {
      publicationId: id_publication,
      name: profile.first_name + ' ' + profile.last_name,
      photo: profile.photo,
    };
    this.miniProfileView.push(miniProfileView);
    this.loadPhotosDonees(miniProfileView.photo);
    
  }

  loadPhotosDonees(profile: any) {
    console.log('hola :'+ profile);
    this._donees.getPhotoNT(profile).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.photoUrls[profile] = url;
      },
      error: (err) => {
        console.error('Error loading photo for', profile.name, err);
      },
    });
  }

  createImageFromBlob(imageId: string): string | null {
    const blob = this.imagesMap.get(imageId);
    return blob ? URL.createObjectURL(blob) : null;
  }


  deletePublications(id: number): void {
    this.publicationService.deletePublication(id.toString()).subscribe({
      next: () => {
        console.log('Publicación eliminada');
        this.loadPublications();
      },
      error: (error) => console.error('Error al eliminar publicación', error)
    });
  }

  addComment(_id: string, commentContent: string): void {
    console.log('Comment content:', commentContent); // Verificar el valor aquí
    this.commentService.addComment(_id, commentContent).subscribe({
      next: (newComment: IComments) => {
        this.comments.push(newComment); // Agrega el nuevo comentario al array
      },
      error: (error: any) => console.error('Error al agregar comentario:', error)
    });
  }
  

}
